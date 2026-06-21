"""
Cortisoul — Prediction Service  v4.1.0
Mental Health Text Classification + Stress Score Regression
"""

import os
import re
import logging
import traceback
from contextlib import asynccontextmanager
from typing import List

import numpy as np
import torch
import tensorflow as tf
from transformers import AutoTokenizer, AutoModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# Konstanta
BERT_MAX_LEN = 256      
BERT_DIM     = 768      
BERT_OVERLAP = 32      
STRESS_MIN   = 1.0
STRESS_MAX   = 10.0

FOCAL_ALPHA  = [2.5, 3.0, 3.0, 3.5, 4.0, 3.0, 4.0]

LABEL_MAPPING = {
    0: "anxiety",
    1: "bipolar",
    2: "depression",
    3: "normal",
    4: "personality_disorder",
    5: "stress",
    6: "suicidal",
}

# Path
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH     = os.getenv("MODEL_PATH",     os.path.join(BASE_DIR, "cortisoul_indobert_model.keras"))
TOKENIZER_DIR  = os.getenv("TOKENIZER_DIR",  os.path.join(BASE_DIR, "cortisoul_tokenizer"))
BERT_MODEL_DIR = os.getenv("BERT_MODEL_DIR", os.path.join(BASE_DIR, "cortisoul_bert_model"))

# Global State
_keras_model = None
_bert_tok    = None
_bert_model  = None
_device      = None


# Custom Keras Objects

@tf.keras.utils.register_keras_serializable()
class AttentionLayer(tf.keras.layers.Layer):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def build(self, input_shape):
        self.W = self.add_weight(
            shape=(input_shape[-1], 1),
            initializer="glorot_uniform",
            trainable=True,
        )
        super().build(input_shape)

    def call(self, x):
        score   = tf.nn.tanh(tf.matmul(x, self.W))
        weights = tf.nn.softmax(score, axis=1)
        return tf.reduce_sum(x * weights, axis=1)

    def get_config(self):
        return super().get_config()


@tf.keras.utils.register_keras_serializable()
class FocalLoss(tf.keras.losses.Loss):

    def __init__(self, gamma: float = 2.0, alpha=None, **kwargs):
        super().__init__(**kwargs)
        self.gamma = float(gamma)
        self.alpha = alpha

    def call(self, y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32)
        y_pred = tf.clip_by_value(y_pred, 1e-7, 1.0 - 1e-7)
        ce     = -tf.reduce_sum(y_true * tf.math.log(y_pred), axis=-1)
        p_t    = tf.reduce_sum(y_true * y_pred, axis=-1)
        fl     = tf.pow(1.0 - p_t, self.gamma) * ce
        if self.alpha is not None:
            alpha_t = tf.reduce_sum(
                y_true * tf.constant(self.alpha, dtype=tf.float32), axis=-1
            )
            fl = alpha_t * fl
        return tf.reduce_mean(fl)

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"gamma": self.gamma, "alpha": self.alpha})
        return cfg


@tf.keras.utils.register_keras_serializable()
def loss_fn(y_true, y_pred):
    return FocalLoss(gamma=2.0, alpha=FOCAL_ALPHA)(y_true, y_pred)


# Preprocessing

def bersihkan_teks(text: str) -> str:
    text = text.lower()
    text = re.sub(r"^RT\s@\w+:\s*", "", text)
    text = re.sub(r"http\S+|www\.\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"#(\w+)", r"\1", text)
    text = re.sub(
        "[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF"
        "\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF"
        "\U00002700-\U000027BF\U0001F900-\U0001F9FF"
        "\U00002600-\U000026FF]+",
        "", text,
    )
    text = re.sub(r"\d+", "", text)

    text = re.sub(r"[^a-zA-Z\s!?,\-]", " ", text)

    return re.sub(r"\s+", " ", text).strip()


# IndoBERT Embedding

def _encode_single_chunk(text_chunk: str) -> np.ndarray:
    encoded = _bert_tok(
        [text_chunk],
        max_length=BERT_MAX_LEN,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )
    input_ids      = encoded["input_ids"].to(_device)
    attention_mask = encoded["attention_mask"].to(_device)
    token_type_ids = encoded.get("token_type_ids")
    if token_type_ids is not None:
        token_type_ids = token_type_ids.to(_device)

    with torch.no_grad():
        out = _bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            token_type_ids=token_type_ids,
        )
    return out.last_hidden_state.cpu().numpy().astype(np.float32)


def get_bert_embedding(text: str) -> np.ndarray:
    tokens       = _bert_tok.encode(text, add_special_tokens=False)
    content_size = BERT_MAX_LEN - 2  

    if len(tokens) <= content_size:
        return _encode_single_chunk(text)  

    step       = content_size - BERT_OVERLAP
    chunk_embs = []
    for start in range(0, len(tokens), step):
        chunk_text = _bert_tok.decode(
            tokens[start: start + content_size], skip_special_tokens=True
        )
        chunk_embs.append(_encode_single_chunk(chunk_text)[0])
        if start + content_size >= len(tokens):
            break

    return np.mean(chunk_embs, axis=0, keepdims=True)


# Utilitas

def score_to_kategori(score: float) -> str:
    if   score <= 2.5: return "Baik"
    elif score <= 4.5: return "Ringan"
    elif score <= 6.5: return "Sedang"
    elif score <= 8.5: return "Berat"
    else:              return "Kritis"


def _check_ready():
    if _keras_model is None:
        raise HTTPException(status_code=503, detail="Keras model belum siap.")
    if _bert_tok is None or _bert_model is None:
        raise HTTPException(status_code=503, detail="IndoBERT belum siap.")


# Lifespan

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _keras_model, _bert_tok, _bert_model, _device

    logger.info(f"Memuat IndoBERT tokenizer dari: {TOKENIZER_DIR}")
    try:
        _bert_tok = AutoTokenizer.from_pretrained(TOKENIZER_DIR)
        logger.info("✓ IndoBERT tokenizer berhasil dimuat.")
    except Exception as e:
        logger.error(
            f"✗ Gagal memuat tokenizer: {e}\n"
            "  Pastikan folder cortisoul_tokenizer/ ada dan berisi file tokenizer."
        )

    logger.info(f"Memuat IndoBERT model dari: {BERT_MODEL_DIR}")
    try:
        _device     = torch.device("cpu")
        _bert_model = AutoModel.from_pretrained(BERT_MODEL_DIR)
        _bert_model.eval()
        _bert_model.to(_device)
        logger.info(f"✓ IndoBERT model dimuat (device={_device}).")
    except Exception as e:
        logger.error(
            f"✗ Gagal memuat IndoBERT model: {e}\n"
            "  Pastikan folder cortisoul_bert_model/ ada dan berisi config.json + weights."
        )

    logger.info(f"Memuat Keras model dari: {MODEL_PATH}")
    try:
        _keras_model = tf.keras.models.load_model(
            MODEL_PATH,
            custom_objects={
                "AttentionLayer": AttentionLayer,
                "FocalLoss"     : FocalLoss,
                "loss_fn"       : loss_fn,
            },
        )
        input_shapes  = [str(i.shape) for i in _keras_model.inputs]
        output_shapes = [str(o.shape) for o in _keras_model.outputs]
        logger.info(
            f"✓ Keras model dimuat.\n"
            f"  inputs : {input_shapes}\n"
            f"  outputs: {output_shapes}"
        )
    except Exception as e:
        logger.error(f"✗ Gagal memuat Keras model: {e}\n{traceback.format_exc()}")

    yield
    logger.info("Cortisoul service berhenti.")


# FastAPI App

app = FastAPI(
    title="Cortisoul — Prediction Service (IndoBERT)",
    description=(
        "Prediksi label kesehatan mental + skor stres dari teks Bahasa Indonesia.\n\n"
        "**Model input** : `bert_input` — pre-computed IndoBERT hidden states (256 × 768)\n\n"
        "**Model output** : `status_output` (7 kelas, softmax) + `stress_output` (1.0–10.0)"
    ),
    version="4.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Schema

class PredictRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        example="Hari ini berjalan cukup lancar, aku sempat makan siang santai dengan teman.",
    )

class BatchPredictRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1, max_length=20)

class ProbabilityDetail(BaseModel):
    anxiety:              str
    bipolar:              str
    depression:           str
    normal:               str
    personality_disorder: str
    stress:               str
    suicidal:             str

class PredictResponse(BaseModel):
    input_text:          str
    cleaned_text:        str
    prediksi_label:      str
    confidence:          str
    stress_score:        float = Field(..., ge=1.0, le=10.0)
    kategori_stres:      str
    detail_probabilitas: ProbabilityDetail

class BatchPredictResponse(BaseModel):
    results: List[PredictResponse]
    total:   int


# Inference

def run_inference(raw_text: str) -> dict:
    teks_bersih = bersihkan_teks(raw_text)
    if not teks_bersih:
        raise HTTPException(status_code=422, detail="Teks kosong setelah dibersihkan.")

    bert_emb = get_bert_embedding(teks_bersih)

    status_probs_raw, stress_norm = _keras_model.predict(
        {"bert_input": bert_emb}, verbose=0
    )

    probs        = status_probs_raw[0]              
    kelas        = int(np.argmax(probs))
    score_raw    = float(stress_norm[0][0]) * (STRESS_MAX - STRESS_MIN) + STRESS_MIN
    stress_score = round(float(np.clip(score_raw, STRESS_MIN, STRESS_MAX)), 2)

    return dict(
        input_text          = raw_text,
        cleaned_text        = teks_bersih,
        prediksi_label      = LABEL_MAPPING[kelas],
        confidence          = f"{probs[kelas] * 100:.2f}%",
        stress_score        = stress_score,
        kategori_stres      = score_to_kategori(stress_score),
        detail_probabilitas = ProbabilityDetail(
            **{LABEL_MAPPING[i]: f"{p * 100:.2f}%" for i, p in enumerate(probs)}
        ),
    )


# Endpoints

@app.get("/health", tags=["Utilitas"])
def health_check():
    return {
        "status"            : "ok",
        "keras_model_loaded": _keras_model is not None,
        "bert_tok_loaded"   : _bert_tok is not None,
        "bert_model_loaded" : _bert_model is not None,
        "bert_device"       : str(_device),
        "version"           : "4.1.0",
    }


@app.get("/labels", tags=["Utilitas"])
def get_labels():
    return {
        "labels": LABEL_MAPPING,
        "stress_categories": {
            "Baik"   : "1.0–2.5",
            "Ringan" : "2.6–4.5",
            "Sedang" : "4.6–6.5",
            "Berat"  : "6.6–8.5",
            "Kritis" : "8.6–10.0",
        },
    }


@app.post(
    "/predict",
    response_model=PredictResponse,
    tags=["Prediksi"],
    summary="Prediksi label kesehatan mental dari satu teks",
)
def predict(body: PredictRequest):
    _check_ready()
    try:
        return PredictResponse(**run_inference(body.text))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Predict error:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post(
    "/predict/batch",
    response_model=BatchPredictResponse,
    tags=["Prediksi"],
    summary="Prediksi batch (maks 20 teks — IndoBERT lebih lambat per teks)",
)
def predict_batch(body: BatchPredictRequest):
    _check_ready()
    results = []
    for t in body.texts:
        try:
            results.append(PredictResponse(**run_inference(t)))
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Batch error on '{t[:50]}':\n{traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
    return BatchPredictResponse(results=results, total=len(results))


@app.get(
    "/debug/model-info",
    tags=["Utilitas"],
    summary="Info arsitektur model (debugging)",
)
def model_info():
    _check_ready()
    return {
        "model_input" : [
            {"name": i.name, "shape": str(i.shape)}
            for i in _keras_model.inputs
        ],
        "model_output": [
            {"name": o.name, "shape": str(o.shape)}
            for o in _keras_model.outputs
        ],
        "bert_max_len": BERT_MAX_LEN,
        "bert_dim"    : BERT_DIM,
        "bert_overlap": BERT_OVERLAP,
        "labels"      : LABEL_MAPPING,
    }
