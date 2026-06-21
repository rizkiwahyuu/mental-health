FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    torch==2.3.0+cpu \
    --extra-index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "\
from transformers import AutoTokenizer, AutoModel; \
print('Mengunduh IndoBERT tokenizer...'); \
tok = AutoTokenizer.from_pretrained('indobenchmark/indobert-base-p1'); \
tok.save_pretrained('/app/cortisoul_tokenizer'); \
print('Mengunduh IndoBERT model weights...'); \
model = AutoModel.from_pretrained('indobenchmark/indobert-base-p1'); \
model.save_pretrained('/app/cortisoul_bert_model'); \
print('IndoBERT berhasil disimpan lokal.')"

ENV TRANSFORMERS_OFFLINE=1 \
    HF_DATASETS_OFFLINE=1

COPY main.py .
COPY cortisoul_indobert_model.keras .

ENV MODEL_PATH=/app/cortisoul_indobert_model.keras \
    TOKENIZER_DIR=/app/cortisoul_tokenizer \
    BERT_MODEL_DIR=/app/cortisoul_bert_model

EXPOSE 8000

CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--timeout-keep-alive", "60"]
