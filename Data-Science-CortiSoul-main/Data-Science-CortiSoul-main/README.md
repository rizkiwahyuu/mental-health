# 🧠 CortiSoul — Analisis Kondisi Kesehatan Mental dari Teks Journaling

> **Capstone Project** · Analisis Data · Natural Language Processing (NLP)  
> Deteksi otomatis kondisi kesehatan mental berbasis teks journaling Bahasa Indonesia

---

## 📓 Lihat Notebook

Notebook utama berisi 131 cell dengan output visualisasi lengkap.
Karena ukurannya besar, GitHub tidak dapat merendernya secara langsung.
Gunakan salah satu link berikut:

| Platform | Link | Keterangan |
|---|---|---|
| **nbviewer** | [![nbviewer](https://raw.githubusercontent.com/jupyter/design/master/logos/Badges/nbviewer_badge.svg)](https://nbviewer.org/github/capstone-project-CortiSoul-CC26-PSU353/Data-Science-CortiSoul/blob/main/Notebook_CortiSoul_Data_Science.ipynb) | Render lengkap dengan output |
| **Google Colab** | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/capstone-project-CortiSoul-CC26-PSU353/Data-Science-CortiSoul/blob/main/Notebook_CortiSoul_Data_Science.ipynb) | Backup jika nbviewer tidak tersedia |

> ⚠️ Jika nbviewer menampilkan error 503, gunakan link Google Colab sebagai alternatif.

---

## 📌 Deskripsi Proyek

**CortiSoul** adalah sistem berbasis *Natural Language Processing* (NLP) yang dirancang untuk menganalisis teks journaling berbahasa Indonesia guna mendeteksi kondisi emosional dan tingkat stres pengguna secara otomatis.

Dalam lingkungan akademik dan profesional, banyak individu mengalami tekanan tinggi tanpa memiliki kesadaran yang cukup terhadap kondisi mental mereka. Proyek ini hadir sebagai solusi berbasis data untuk mendukung deteksi dini kondisi kesehatan mental melalui analisis teks.

---

## 🎯 Business Questions

1. **Token/frasa apa** yang paling merepresentasikan masing-masing dari 7 kategori kondisi mental, berdasarkan analisis **Word2Vec** dan **FastText** (top-10 kata paling mirip per kategori, `vector_size=100`, `window=5`) serta visualisasi word cloud?

2. **Bagaimana performa model NLP** menggunakan representasi vektor Word2Vec dan FastText dalam mengklasifikasikan 7 kondisi mental dengan akurasi minimal **80%** dan F1-score **≥ 0,75** melalui evaluasi Stratified 5-Fold Cross-Validation?

---

## 📦 Dataset

| Atribut | Detail |
|---|---|
| **Nama** | Mental Health Condition Classification Dataset |
| **Bahasa** | Indonesia (hasil terjemahan) |
| **Total data asli** | 103.488 entri |
| **Total data awal (terjemahan)** | 9.163 entri |
| **Total data setelah preprocessing** | 9.151 entri |
| **Kolom** | 10 kolom (`text`, `status`, `length`, `clean_text`, `lower`, `normalized`, `tokens`, `text_no_stopword`, `text_stemmed`, `text_preprocessed`) |
| **Jumlah kelas** | 7 kondisi mental |
| **Missing values** | 27 (tersebar di 6 kolom) |

**Catatan kolom:**
> - `text` dan `status` merupakan kolom **asli** dari dataset.
> - `length` merupakan kolom **fitur tambahan** yang dihitung dari panjang karakter `text`.
> - `clean_text`, `lower`, `normalized`, `tokens`, `text_no_stopword`, `text_stemmed`, dan `text_preprocessed` merupakan kolom **hasil preprocessing** yang dihasilkan secara bertahap melalui proses pembersihan teks, normalisasi, tokenisasi, penghapusan stopword, dan stemming.
> - `text_preprocessed` adalah kolom **output akhir** preprocessing yang digunakan sebagai input model klasifikasi.
> - 12 entri dihapus selama preprocessing (9.163 → 9.151) akibat adanya missing values atau duplikat.

### Distribusi Kelas

| Kondisi Mental | Jumlah Data | Persentase |
|---|---|---|
| Suicidal | 1.657 | 18.1% |
| Depression | 1.635 | 17.9% |
| Normal | 1.236 | 13.5% |
| Personality Disorder | 1.234 | 13.5% |
| Stress | 1.233 | 13.5% |
| Anxiety | 1.190 | 13.0% |
| Bipolar | 966 | 10.6% |

---

## ⚙️ Pipeline Proyek

```
📥 Gathering Data
       ↓
🔍 Assessing Data     → Cek missing values (27), duplikat (12), distribusi kelas
       ↓
🧹 Cleaning Data      → Hapus duplikat, bersihkan URL/emoji/karakter khusus, normalisasi slang
       ↓
⚙️ Preprocessing      → Tokenisasi → Stopword Removal → Stemming (Sastrawi) → Filter token < 3 kata
       ↓
📊 EDA & Analisis Token → Word2Vec/FastText most_similar(), word cloud, heatmap overlap, token eksklusif
       ↓
🤖 Modeling           → Word2Vec + FastText × Random Forest + LinearSVC (4 kombinasi, Stratified 5-Fold CV)
       ↓
📈 Evaluasi           → Akurasi, F1-Score Macro, Confusion Matrix, Analisis Kesalahan
       ↓
🧪 A/B Testing        → Word2Vec vs FastText (Logistic Regression, McNemar Test)
```

---

## 🤖 Hasil Pemodelan

### Rekap Performa Semua Model (Stratified 5-Fold Cross-Validation)

| Representasi Vektor | Model Klasifikasi | Akurasi | F1 Macro |
|---|---|---|---|
| **Word2Vec** | **LinearSVC** | **82.9%** | **0.851** |
| Word2Vec | Random Forest | 82.6% | 0.851 |
| FastText | LinearSVC | 82.1% | 0.844 |
| FastText | Random Forest | 81.3% | 0.838 |

### 🏆 Model Terbaik: Word2Vec + LinearSVC

- **Akurasi:** 82.9% ± 0.7% ✅ (target ≥ 80%)
- **F1 Macro:** 0.851 ✅ (target ≥ 0.75)
- Word2Vec unggul karena representasi konteks kata berbasis token lebih stabil untuk teks journaling Bahasa Indonesia

### F1-Score per Kelas (Model Terbaik: Word2Vec + LinearSVC)

| Kondisi | F1-Score | Keterangan |
|---|---|---|
| Bipolar | 0.985 | ✅ Terbaik |
| Personality Disorder | 0.979 | ✅ |
| Stress | 0.977 | ✅ |
| Anxiety | 0.955 | ✅ |
| Normal | 0.765 | ✅ Tepat di batas |
| Suicidal | 0.661 | ⚠️ Di bawah target |
| Depression | 0.636 | ⚠️ Di bawah target |

---

## 🧪 A/B Testing — Word2Vec vs FastText (Logistic Regression)

Pengujian murni pengaruh metode embedding dengan model yang identik (Logistic Regression, parameter dan seed sama):

| Metrik | Word2Vec (A) | FastText (B) | Selisih (B - A) | Unggul |
|---|---|---|---|---|
| Accuracy | 0.7995 | 0.7725 | -0.0270 | Word2Vec |
| Precision | 0.8002 | 0.7730 | -0.0272 | Word2Vec |
| Recall | 0.7995 | 0.7725 | -0.0270 | Word2Vec |
| F1-Score | 0.7998 | 0.7725 | -0.0273 | Word2Vec |

**Uji Statistik McNemar:** Statistik = 72.1287, p-value = **0.0000** → perbedaan **signifikan secara statistik** (p < 0.05). Word2Vec unggul di semua metrik dan semua kelas.

---

## 🔍 Analisis Token Eksklusif

Token eksklusif diidentifikasi via Word2Vec `most_similar()` — kata yang hanya muncul signifikan di satu kondisi tertentu:

| Kondisi | Jumlah Token Eksklusif | Contoh Token |
|---|---|---|
| Anxiety | 10 | *benak, lumpuh, kuasa, gerogot, ragu, tawan* |
| Bipolar | 10 | *mania, meluapluap, produktivitas, euforia, impulsif* |
| Normal | 10 | *meme, anime, santai, hobby, refreshing, seru* |
| Personality Disorder | 10 | *monster, ilusi, fluktuasi, minder, identitas* |
| Stress | 10 | *tenggat, rentet, wajib, deadline, burnout* |
| Suicidal | 8 | *pilih, alamiah, fantasi, kecut, acuh* |
| Depression | 6 | *bertahuntahun, takdir, obsesi, sengsara* |

**Anxiety** paling mudah dibedakan secara leksikal (10 token eksklusif). **Depression** (6) dan **Suicidal** (8) paling sulit — token eksklusif paling sedikit dan tumpang tindih semantik tertinggi.

---

## 🔎 Analisis Kesalahan Klasifikasi

Pasangan kondisi yang paling sering tertukar (Word2Vec + LinearSVC, Stratified 5-Fold):

| Aktual | Prediksi | Jumlah | Recall % |
|---|---|---|---|
| Depression | Suicidal | 466 | 28.5% |
| Suicidal | Depression | 415 | 25.1% |
| Depression | Normal | 137 | 8.4% |
| Suicidal | Normal | 128 | 7.7% |
| Normal | Depression | 99 | 8.0% |
| Normal | Suicidal | 96 | 7.8% |

Total kesalahan depression ↔ suicidal: **881 kasus**. Normal juga sering tumpang tindih dengan keduanya (195 kasus tambahan).

---

## 💡 Kesimpulan

**Pertanyaan 1 — Pola Token per Kondisi (Word2Vec & FastText):**
- Setiap kondisi memiliki token eksklusif yang menjadi ciri khasnya (diidentifikasi via Word2Vec `most_similar()`)
- **Anxiety** paling mudah dibedakan (10 token eksklusif: *benak, lumpuh, kuasa, gerogot, ragu, tawan*, dll.)
- **Stress** dicirikan kata *tenggat, rentet, wajib*; **Personality Disorder** oleh *monster, ilusi, fluktuasi, minder*
- **Depression** (6 token) dan **Suicidal** (8 token) paling sulit dibedakan karena tumpang tindih semantik tertinggi antar kondisi
- Token umum (*pikir, orang, hidup*) muncul lintas kondisi dan tidak membedakan kelas secara spesifik

**Pertanyaan 2 — Performa Model:**
- Semua 4 kombinasi model berhasil melampaui target akurasi ≥ 80% dan F1 Macro ≥ 0.75
- Model terbaik **Word2Vec + LinearSVC** mencapai akurasi **82.9%** dan F1 Macro **0.851**
- Depression (F1 0.636) dan Suicidal (F1 0.661) masih di bawah target 0.75 dan sering tertukar satu sama lain (466 kasus depression → suicidal, 415 kasus suicidal → depression)

---

## 📋 Rekomendasi

1. **Tangani Class Imbalance** — Gunakan SMOTE atau augmentasi data khususnya untuk kelas *depression* dan *suicidal* yang memiliki F1 rendah
2. **Eksperimen Transformer** — Coba IndoBERT atau mBERT yang dioptimasi untuk Bahasa Indonesia
3. **Perluas Dataset** — Tambah data khususnya kelas *bipolar* (966 data, paling sedikit)
4. **Feature Engineering** — Tambahkan fitur sentimen, intensitas emosi, dan fitur pragmatik
5. **Strategi Anti-Overlap** — Kembangkan strategi khusus untuk membedakan pasangan *depression ↔ suicidal* (881 kasus tertukar) dan *normal ↔ depression/suicidal* (195 kasus)
6. **Validasi Klinis** — Validasi model dengan psikolog atau profesional kesehatan mental sebelum deployment

---

## 🗂️ Struktur Folder

```
cortisoul/
│
├── 📁 dashboard/
│   ├── cortisoul_dashboard.py            # Aplikasi Streamlit
│   └── 📁 nb_images/                     # Gambar visualisasi dari notebook
│
├── 📁 data/
│   └── clean_processed.csv               # Dataset hasil preprocessing
│
├── Notebook_CortiSoul_Data_Science.ipynb # Notebook analisis lengkap
├── README.md                             # Dokumentasi proyek
├── requirements.txt                      # Dependensi dashboard
└── url.txt                               # Link deployment
```

---

## 🚀 Cara Menjalankan Dashboard

### 1. Clone repositori

```bash
git clone https://github.com/Lindaputriani/Data-Science-CortiSoul.git
cd cortisoul
```

### 2. Install dependensi

```bash
pip install -r requirements.txt
```

### 3. Jalankan dashboard

```bash
cd dashboard
streamlit run cortisoul_dashboard.py
```

### 4. Buka browser

Dashboard akan otomatis terbuka di `http://localhost:8501`

> **Catatan:** Pastikan file `clean_processed.csv` ada di folder `data/` agar grafik distribusi dan histogram panjang teks menampilkan data aktual (bukan estimasi fallback dari notebook).

---

## 🛠️ Tech Stack

| Kategori | Library |
|---|---|
| **Dashboard** | Streamlit |
| **Manipulasi Data** | Pandas, NumPy |
| **Visualisasi** | Plotly (express, graph_objects, subplots) |

---

## 📌 Requirements

```
streamlit>=1.32.0
pandas>=2.0.0
numpy>=1.24.0
plotly>=5.18.0
```

Install dependensi:

```bash
pip install -r requirements.txt
```

---

*CortiSoul Capstone Project · NLP untuk Kesehatan Mental · Bahasa Indonesia*
