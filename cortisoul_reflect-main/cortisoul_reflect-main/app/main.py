"""
Cortisoul — Reflection Service
Menghasilkan refleksi personal berbasis Gemini dari hasil prediksi + teks jurnal.
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager

import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
_gemini_client = None


# Prompt Gemini
LABEL_CONTEXT = {
    "anxiety"             : "kecemasan dan kekhawatiran berlebih",
    "bipolar"             : "perubahan suasana hati yang signifikan",
    "depression"          : "perasaan sedih mendalam dan kehilangan semangat",
    "normal"              : "kondisi emosional yang stabil",
    "personality_disorder": "kesulitan dalam pola pikir dan hubungan sosial",
    "stress"              : "tekanan dan beban yang terasa berat",
    "suicidal"            : "pikiran yang sangat menyakitkan dan perasaan tidak ingin melanjutkan hidup",
}

LABEL_TONE = {
    "anxiety"             : "Fokus pada menenangkan pikiran, grounding, dan mengurai kekhawatiran satu per satu.",
    "bipolar"             : "Fokus pada stabilitas rutinitas, pentingnya istirahat, dan menjaga keseimbangan energi.",
    "depression"          : "Fokus pada validasi rasa lelah, langkah kecil yang berarti, dan mengingatkan bahwa perasaan ini bisa berubah.",
    "normal"              : "Fokus pada apresiasi atas kondisi yang baik dan bagaimana mempertahankan keseimbangan ini.",
    "personality_disorder": "Fokus pada kesadaran diri, pola hubungan, dan pentingnya dukungan profesional dengan cara yang lembut.",
    "stress"              : "Fokus pada mengurai sumber tekanan, menetapkan batas, dan menemukan ruang untuk bernapas.",
    "suicidal"            : (
        "Ini adalah situasi yang sangat serius. "
        "Fokus sepenuhnya pada hadir bersama mereka, validasi rasa sakit mereka tanpa menghakimi, "
        "dan sampaikan dengan hangat bahwa bantuan profesional tersedia. "
        "Jangan terkesan menggurui atau panik."
    ),
}


def build_gemini_prompt(jurnal: str, label: str, stress_score: float, kategori: str) -> str:
    konteks_label = LABEL_CONTEXT.get(label, label)
    tone_guide    = LABEL_TONE.get(label, "")

    return f"""Kamu adalah Cortisoul — teman yang hangat, penuh semangat, dan selalu percaya pada kemampuan orang yang berbicara denganmu.

Seseorang menuliskan ini untukmu:

\"\"\"{jurnal}\"\"\"

Kondisi terdeteksi: {konteks_label} (skor stres {stress_score}/10, kategori: {kategori})

{tone_guide}

Tuliskan refleksi dalam bahasa Indonesia yang mengalir, hangat, dan MEMBANGKITKAN SEMANGAT. \
Tujuanmu adalah membuat mereka merasa: didengar, dihargai, dan yakin bahwa mereka MAMPU melewati ini.

Struktur yang harus kamu ikuti:

Paragraf 1 — VALIDASI + KEKUATAN TERSEMBUNYI:
Akui perasaan mereka secara spesifik berdasarkan isi tulisan. Tapi langsung tunjukkan bahwa \
kenyataan mereka MAU menuliskan ini adalah bukti keberanian dan kekuatan yang masih ada dalam diri mereka.

Paragraf 2 — SUDUT PANDANG BARU YANG MEMBESARKAN HATI:
Bantu mereka melihat situasi dari perspektif yang lebih luas dan penuh harapan. \
Ingatkan bahwa perasaan berat ini adalah bagian dari perjalanan, bukan akhir dari segalanya. \
Sebutkan satu hal konkret dari tulisan mereka yang menunjukkan mereka lebih kuat dari yang mereka kira.

Paragraf 3 — LANGKAH KECIL YANG ENERGIZING:
Berikan 2-3 tindakan kecil yang ringan namun bermakna untuk dilakukan hari ini atau besok. \
Sampaikan dengan nada penuh keyakinan bahwa mereka BISA melakukannya. \
Tutup dengan kalimat penutup yang hangat dan memberi semangat — buat mereka tersenyum kecil.

Aturan penting:
- Jangan larut dalam kesedihan — validasi secukupnya lalu arahkan ke harapan
- Jangan gunakan bullet point atau numbering dalam respons
- Jangan sebut istilah medis atau diagnosis
- Jangan mulai dengan "Halo" atau salam formal
- Nada: seperti sahabat yang percaya penuh padamu, hangat tapi juga menyemangati
- Gunakan 3 paragraf pendek
- Total panjang 100–150 kata
- Maksimal 150 kata
- Buat kalimat ringkas dan langsung ke inti"""


# Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _gemini_client

    logger.info("Menginisialisasi Gemini API...")
    if GEMINI_API_KEY:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            _gemini_client = genai.GenerativeModel(
                model_name=GEMINI_MODEL,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.8,
                    max_output_tokens=4096,
                ),
            )
            logger.info(f"✓ Gemini ({GEMINI_MODEL}) siap.")
        except Exception as e:
            logger.error(f"✗ Gagal inisialisasi Gemini: {e}")
    else:
        logger.warning("GEMINI_API_KEY tidak diset — fitur refleksi tidak aktif.")

    yield
    logger.info("Aplikasi berhenti.")


# FastAPI
app = FastAPI(
    title="Cortisoul — Reflection Service",
    description="Menghasilkan refleksi personal berbasis Gemini dari teks jurnal + hasil prediksi.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Schema
class ReflectRequest(BaseModel):
    text: str = Field(
        ..., min_length=3, max_length=5000,
        example="Aku merasa sangat lelah, setiap hari rasanya hampa dan kosong.",
        description="Teks jurnal asli dari pengguna.",
    )
    prediksi_label: str = Field(
        ..., example="depression",
        description="Label hasil prediksi dari Prediction Service.",
    )
    stress_score: float = Field(
        ..., ge=1.0, le=10.0, example=7.4,
        description="Skor stres hasil prediksi.",
    )
    kategori_stres: str = Field(
        ..., example="Berat",
        description="Kategori stres hasil prediksi.",
    )

class RefleksiAI(BaseModel):
    teks:             str
    model:            str
    ada_pesan_krisis: bool = Field(description="True jika label adalah suicidal")


# Generate refleksi
async def generate_refleksi(
    jurnal: str, label: str, stress_score: float, kategori: str
) -> RefleksiAI:
    """Panggil Gemini API untuk menghasilkan refleksi personal."""
    prompt   = build_gemini_prompt(jurnal, label, stress_score, kategori)
    response = await asyncio.to_thread(_gemini_client.generate_content, prompt)
    teks     = response.text.strip()
    return RefleksiAI(teks=teks, model=GEMINI_MODEL, ada_pesan_krisis=(label == "suicidal"))


# Endpoints
@app.get("/health", tags=["Utilitas"])
def health_check():
    return {
        "status"      : "ok",
        "gemini_ready": _gemini_client is not None,
        "gemini_model": GEMINI_MODEL,
        "version"     : "2.0.0",
    }


@app.post("/reflect", response_model=RefleksiAI, tags=["Refleksi"],
          summary="Generate refleksi personal dari Gemini")
async def reflect(body: ReflectRequest):
    """
    Menerima teks jurnal + hasil prediksi dari Prediction Service,
    mengembalikan refleksi personal yang hangat dan membangkitkan semangat.

    Panggil endpoint ini setelah mendapatkan hasil dari /predict di Prediction Service.
    """
    if _gemini_client is None:
        raise HTTPException(status_code=503, detail="Gemini tidak siap. Cek GEMINI_API_KEY.")
    try:
        return await generate_refleksi(
            jurnal       = body.text,
            label        = body.prediksi_label,
            stress_score = body.stress_score,
            kategori     = body.kategori_stres,
        )
    except Exception as e:
        logger.error(f"Gemini error: {e}")
        raise HTTPException(status_code=502, detail=f"Gemini error: {str(e)}")
