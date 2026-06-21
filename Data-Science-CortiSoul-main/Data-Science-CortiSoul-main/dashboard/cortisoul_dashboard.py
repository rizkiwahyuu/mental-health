import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import base64, os

# ─── Helper: muat gambar dari notebook ──────────────────────────────────────
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(_THIS_DIR, "nb_images")

# ─── Load Data dari folder ../data/ ─────────────────────────────────────────
import glob as _glob

@st.cache_data
def load_data():
    base     = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base, "..", "data")
    for ext in ["*.csv", "*.xlsx", "*.xls"]:
        files = _glob.glob(os.path.join(data_dir, ext))
        if files:
            fname = files[0]
            df = pd.read_csv(fname) if fname.endswith(".csv") else pd.read_excel(fname)
            return df, os.path.basename(fname)
    return None, None

df_raw, data_filename = load_data()

def show_nb_image(filename, caption=""):
    candidates = [
        os.path.join(_THIS_DIR, "nb_images", filename),
        os.path.join(os.getcwd(), "nb_images", filename),
        os.path.join(os.getcwd(), "dashboard", "nb_images", filename),
    ]
    path = None
    for c in candidates:
        if os.path.exists(c):
            path = c
            break
    if path:
        _, col_img, _ = st.columns([0.5, 9, 0.5])
        with col_img:
            st.image(path, caption=caption, use_container_width=True)
    else:
        st.warning(f"⚠️ Gambar tidak ditemukan: **{filename}**  \nPastikan folder `nb_images/` ada di dalam folder `dashboard/`")

# ─── Konfigurasi halaman ──────────────────────────────────────────────────────
st.set_page_config(
    page_title="CortiSoul Dashboard",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─── CSS Kustom ───────────────────────────────────────────────────────────────
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

    :root {
        --p1: #0D9488;
        --p2: #10B981;
        --teal: #0D9488;
        --green: #10B981;
        --amber: #F59E0B;
        --red: #EF4444;
        --radius: 16px;
        --radius-sm: 10px;

        /* Light mode defaults */
        --bg: #FFFFFF;
        --bg-secondary: #F8FAFC;
        --text: #111827;
        --text-secondary: #374151;
        --muted: #6B7280;
        --border: #E5E7EB;
        --card-bg: #FFFFFF;
        --card-shadow: rgba(15, 23, 42, 0.06);
        --nav-bg: #F8FAFC;
        --box-bg: #FFFFFF;
        --box-text: #374151;
    }

    @media (prefers-color-scheme: dark) {
        :root {
            --bg: #0F172A;
            --bg-secondary: #1E293B;
            --text: #F1F5F9;
            --text-secondary: #CBD5E1;
            --muted: #94A3B8;
            --border: #334155;
            --card-bg: #1E293B;
            --card-shadow: rgba(0, 0, 0, 0.3);
            --nav-bg: #1E293B;
            --box-bg: #1E293B;
            --box-text: #CBD5E1;
        }
    }

    @keyframes fadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    /* ── BASE ── */
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif !important;
        color: var(--text) !important;
        background: var(--bg) !important;
    }

    .stApp,
    [data-testid="stAppViewContainer"],
    [data-testid="stAppViewContainer"] > section,
    [data-testid="stBottom"],
    .stMainBlockContainer,
    .main, .main > div {
        background-color: var(--bg) !important;
        color: var(--text) !important;
    }

    /* ── HIDE STREAMLIT CHROME ── */
    [data-testid="stHeader"]     { display: none !important; }
    [data-testid="stDecoration"] { display: none !important; }
    [data-testid="stToolbar"]    { display: none !important; }
    #MainMenu                    { visibility: hidden !important; }
    footer                       { visibility: hidden !important; }
    [data-testid="collapsedControl"] { display: none; }
    section[data-testid="stSidebar"] { display: none; }

    /* ── PREVENT HORIZONTAL SCROLL ── */
    html, body { overflow-x: hidden !important; width: 100% !important; }
    .stApp { overflow-x: hidden !important; }

    /* ── CONTAINER ── */
    .block-container {
        padding-top: 0.6rem !important;
        padding-bottom: 2rem !important;
        padding-left: 2rem !important;
        padding-right: 2rem !important;
        max-width: 100% !important;
        width: 100% !important;
        box-sizing: border-box !important;
        animation: fadeUp 0.5s ease both;
    }
    [data-testid="stAppViewContainer"] > .main > .block-container {
        max-width: 1100px !important;
        margin-left: auto !important;
        margin-right: auto !important;
    }
    [data-testid="stHorizontalBlock"] { width: 100% !important; box-sizing: border-box !important; }
    [data-testid="column"] { min-width: 0 !important; overflow: hidden !important; }

    /* ── TOPBAR ── */
    .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.6rem;
        background: linear-gradient(135deg, #0D9488 0%, #10B981 60%, #06B6D4 100%);
        border-radius: var(--radius);
        padding: 0.65rem 1.2rem;
        margin-bottom: 0.7rem;
        box-shadow: 0 10px 25px rgba(13,148,136,0.2);
        border: 1px solid rgba(255,255,255,0.2);
    }
    .topbar-brand {
        font-family: 'Syne', sans-serif;
        font-size: clamp(0.95rem, 2.5vw, 1.15rem);
        font-weight: 800;
        color: white;
        white-space: nowrap;
        flex-shrink: 0;
    }
    .topbar-brand span {
        display: none;
        font-size: 0.68rem;
        color: rgba(255,255,255,0.75);
        margin-left: 8px;
        font-weight: 400;
    }
    .topbar-info { display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center; }
    .topbar-stat {
        background: rgba(255,255,255,0.15);
        border-radius: 999px;
        padding: 3px 10px;
        color: white;
        font-size: clamp(0.65rem, 1.8vw, 0.75rem);
        border: 1px solid rgba(255,255,255,0.2);
        white-space: nowrap;
    }

    /* ── NAVIGATION ── */
    .nav-scroll-wrap {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding-bottom: 4px;
        margin-bottom: 0.6rem;
    }
    .nav-scroll-wrap::-webkit-scrollbar { display: none; }

    .nav-scroll-wrap div[data-testid="stHorizontalBlock"] {
        background: var(--nav-bg) !important;
        border-radius: 999px !important;
        padding: 5px !important;
        border: 1px solid var(--border) !important;
        gap: 4px !important;
        flex-wrap: nowrap !important;
        min-width: max-content !important;
    }
    .nav-scroll-wrap div[data-testid="stHorizontalBlock"] .stButton button {
        border-radius: 999px !important;
        font-size: 0.8rem !important;
        font-weight: 600 !important;
        padding: 0.4rem 0.7rem !important;
        border: none !important;
        white-space: nowrap !important;
    }
    .nav-scroll-wrap div[data-testid="stHorizontalBlock"] .stButton button[kind="primary"] {
        background: linear-gradient(135deg, #0D9488, #10B981) !important;
        color: white !important;
    }
    .nav-scroll-wrap div[data-testid="stHorizontalBlock"] .stButton button[kind="secondary"] {
        background: transparent !important;
        color: var(--muted) !important;
    }
    .nav-scroll-wrap div[data-testid="stHorizontalBlock"] .stButton button[kind="secondary"]:hover {
        background: rgba(13,148,136,0.08) !important;
        color: var(--p1) !important;
    }

    /* ── METRIC CARD ── */
    [data-testid="stMetric"] {
        background: var(--card-bg) !important;
        border-radius: 10px !important;
        padding: 0.55rem 0.8rem !important;
        border: 1px solid var(--border) !important;
        box-shadow: 0 1px 4px var(--card-shadow);
    }
    [data-testid="stMetricValue"] {
        color: var(--text) !important;
        font-family: 'Syne', sans-serif !important;
        font-size: 1.25rem !important;
        font-weight: 700 !important;
        line-height: 1.15 !important;
        word-break: break-word !important;
    }
    [data-testid="stMetricLabel"] p {
        color: var(--muted) !important;
        font-size: 0.65rem !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        margin-bottom: 0 !important;
        letter-spacing: 0.03em !important;
    }
    [data-testid="stMetricDelta"] { font-size: 0.65rem !important; margin-top: 0.1rem !important; }

    /* ── SECTION HEADER ── */
    .section-header {
        font-family: 'Syne', sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--text);
        margin: 1rem 0 0.5rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid var(--border);
    }

    /* ── PAGE TITLE ── */
    .main-title {
        font-family: 'Syne', sans-serif;
        font-size: clamp(1.5rem, 4vw, 2rem);
        font-weight: 800;
        background: linear-gradient(135deg, #0D9488 0%, #10B981 50%, #06B6D4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.2rem;
        line-height: 1.2;
    }
    .subtitle {
        color: var(--muted);
        font-size: clamp(0.78rem, 1.8vw, 0.88rem);
        margin-bottom: 1rem;
        line-height: 1.5;
    }

    /* ── INFO BOXES ── */
    .insight-box, .warning-box, .success-box {
        border-radius: 10px;
        padding: 0.65rem 0.9rem;
        margin: 0.4rem 0;
        line-height: 1.6;
        border: 1px solid var(--border);
        background: var(--box-bg);
        color: var(--box-text);
        font-size: clamp(0.78rem, 1.6vw, 0.85rem);
        word-break: break-word;
    }
    .insight-box { border-left: 4px solid #0D9488; }
    .warning-box { border-left: 4px solid #F59E0B; }
    .success-box { border-left: 4px solid #10B981; }

    /* ── TAG ── */
    .tag {
        display: inline-block;
        background: rgba(13,148,136,0.12);
        color: #0D9488;
        border-radius: 999px;
        padding: 4px 12px;
        font-size: 0.8rem;
        font-weight: 600;
        margin: 3px;
        border: 1px solid rgba(13,148,136,0.25);
    }
    @media (prefers-color-scheme: dark) {
        .tag { color: #5EEAD4; background: rgba(13,148,136,0.2); border-color: rgba(94,234,212,0.3); }
    }

    /* ── TABS ── */
    .stTabs [data-baseweb="tab-list"] {
        background: var(--nav-bg);
        border-radius: 12px;
        padding: 5px;
        gap: 3px;
        border: 1px solid var(--border);
        overflow-x: auto;
        flex-wrap: nowrap !important;
        scrollbar-width: none;
    }
    .stTabs [data-baseweb="tab-list"]::-webkit-scrollbar { display: none; }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px !important;
        color: var(--muted) !important;
        font-weight: 600 !important;
        font-size: clamp(0.74rem, 1.6vw, 0.85rem) !important;
        padding: 0.45rem 0.9rem !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
    }
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, #0D9488, #10B981) !important;
        color: white !important;
    }

    /* ── DATAFRAME ── */
    [data-testid="stDataFrame"] {
        border-radius: 12px !important;
        border: 1px solid var(--border) !important;
        overflow: auto !important;
        max-width: 100% !important;
    }

    /* ── EXPANDER ── */
    [data-testid="stExpander"] {
        border: 1px solid var(--border) !important;
        border-radius: 12px !important;
        background: var(--card-bg) !important;
    }

    /* ── MARKDOWN ── */
    .stMarkdown p, .stMarkdown li, .stMarkdown span {
        color: var(--text-secondary) !important;
        word-break: break-word !important;
    }
    h1, h2, h3, h4, h5, h6 { color: var(--text) !important; }

    /* ── PLOTLY ── */
    .js-plotly-plot, .plotly { width: 100% !important; }

    /* ── IMAGES ── */
    img { max-width: 100% !important; height: auto !important; }

    /* ══ RESPONSIVE ══ */
    @media (min-width: 480px) {
        .topbar-brand span { display: inline; }
        .block-container { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
    }
    @media (max-width: 640px) {
        .topbar { flex-direction: column; align-items: flex-start; border-radius: 12px; padding: 0.75rem 1rem; }
        .topbar-info { gap: 0.25rem; }
        .topbar-stat { font-size: 0.65rem; padding: 2px 8px; }
        [data-testid="stMetric"] { padding: 0.8rem 0.9rem !important; }
        [data-testid="stMetricValue"] { font-size: 1.35rem !important; }
        .step-flow { flex-wrap: wrap !important; }
    }
    @media (max-width: 480px) {
        .block-container { padding-left: 0.6rem !important; padding-right: 0.6rem !important; }
        .main-title { font-size: 1.65rem !important; }
        .subtitle   { font-size: 0.8rem !important; }
        .section-header { font-size: 0.9rem !important; }
        .insight-box, .warning-box, .success-box { padding: 0.7rem 0.85rem; font-size: 0.8rem; }
    }

</style>
""", unsafe_allow_html=True)

# ─── Data yang sudah diekstrak dari notebook ────────────────────────────────
_LABEL_FALLBACK = {
    'suicidal': 1657, 'depression': 1635, 'normal': 1236,
    'personality disorder': 1234, 'stress': 1233, 'anxiety': 1190, 'bipolar': 966,
}

def _get_label_dist(df):
    if df is None:
        return _LABEL_FALLBACK
    label_col = next(
        (c for c in df.columns if c.lower() in ['status', 'label', 'kondisi', 'condition', 'target']),
        None
    )
    if label_col is None:
        return _LABEL_FALLBACK
    vc = df[label_col].value_counts()
    return {str(k): int(v) for k, v in vc.items()}

label_dist = _get_label_dist(df_raw)

model_performance = pd.DataFrame({
    'Representasi Vektor': ['Word2Vec', 'Word2Vec', 'FastText', 'FastText'],
    'Model Klasifikasi':   ['Random Forest', 'LinearSVC', 'Random Forest', 'LinearSVC'],
    'Akurasi': [0.826, 0.829, 0.813, 0.821],
    'F1 Macro': [0.851, 0.851, 0.838, 0.844],
})

f1_per_kelas = {
    'anxiety': 0.955, 'bipolar': 0.985, 'depression': 0.636,
    'normal': 0.765, 'personality disorder': 0.979, 'stress': 0.977, 'suicidal': 0.661,
}

token_eksklusif = {
    'anxiety': ['benak', 'lumpuh', 'kuasa', 'gerogot', 'ragu', 'tawan', 'pikiranpikiranku', 'pikiranpikiran', 'gusar', 'waswas'],
    'bipolar': ['mania', 'meluapluap', 'produktivitas', 'lesu', 'antusiasme', 'optimisme', 'keputusasaanku', 'jerumus', 'euforia', 'impulsif'],
    'depression': ['bertahuntahun', 'takdir', 'obsesi', 'sengsara', 'akhirakhir', 'esensial', 'halhal'],
    'normal': ['meme', 'anime', 'telusur', 'barangsiapa', 'bersenangsenang', 'santai', 'hobby', 'refreshing', 'seru', 'produktif'],
    'personality disorder': ['monster', 'ilusi', 'fluktuasi', 'minder', 'versi', 'pegang', 'bagianbagian', 'sindir', 'bimbing', 'identitas'],
    'stress': ['tenggat', 'rentet', 'wajib', 'kuras', 'tenggak', 'beban', 'deadline', 'tuntutan', 'overload', 'burnout'],
    'suicidal': ['pilih', 'alamiah', 'fantasi', 'kecut', 'guna', 'tanpa', 'acuh', 'hidupaku'],
}

top3_w2v = {
    'suicidal':             ['kecut', 'guna', 'tanpa'],
    'anxiety':              ['gerogot', 'ragu', 'tawan'],
    'bipolar':              ['lesu', 'antusiasme', 'optimisme'],
    'depression':           ['obsesi', 'sengsara', 'apa'],
    'personality disorder': ['minder', 'versi', 'pegang'],
    'normal':               ['meme', 'anime', 'telusur'],
    'stress':               ['wajib', 'tenggat', 'rentet'],
}

top3_ft = {
    'suicidal':             ['acuh', 'hidupaku', 'ego'],
    'anxiety':              ['pikiranpikiranku', 'pikiranpikiran', 'gusar'],
    'bipolar':              ['lesu', 'keputusasaanku', 'jerumus'],
    'depression':           ['akhirakhir', 'esensial', 'halhal'],
    'personality disorder': ['bagianbagian', 'sindir', 'bimbing'],
    'normal':               ['barangsiapa', 'bersenangsenang', 'santai'],
    'stress':               ['tenggat', 'tenggak', 'kuras'],
}

confusion_pairs = pd.DataFrame({
    'Aktual':    ['depression', 'suicidal', 'depression', 'suicidal', 'normal', 'normal', 'anxiety', 'normal', 'normal', 'normal'],
    'Prediksi':  ['suicidal', 'depression', 'normal', 'normal', 'depression', 'suicidal', 'normal', 'anxiety', 'personality disorder', 'stress'],
    'Jumlah':    [466, 415, 137, 128, 99, 96, 30, 21, 21, 20],
    'Recall %':  [28.5, 25.1, 8.4, 7.7, 8.0, 7.8, 2.5, 1.7, 1.7, 1.6],
})

def _get_stats(df):
    base = {
        'total_data_asli': 103488,   # dataset original sebelum translasi
        'total_data_awal': 9163,     # data mentah setelah translasi ke Bahasa Indonesia
        'total_data': 9151,          # data setelah preprocessing (clean_processed.csv)
        'data_bersih': 9151, 'data_setelah_filter': 9151,
        'jumlah_kolom': 10, 'missing_values': 27, 'duplikat_teks': 68,
        'fitur_unik': 5000, 'min_panjang': 4, 'max_panjang': 5902,
        'median_panjang': 217, 'mean_panjang': 465,
    }
    if df is None:
        return base
    text_col = next(
        (c for c in df.columns if c.lower() in ['text', 'teks', 'clean_text', 'text_preprocessed', 'content']),
        None
    )
    if text_col:
        lengths = df[text_col].dropna().astype(str).apply(len)
        base['total_data']     = len(df)
        base['min_panjang']    = int(lengths.min())
        base['max_panjang']    = int(lengths.max())
        base['median_panjang'] = int(lengths.median())
        base['mean_panjang']   = int(lengths.mean())
    else:
        base['total_data'] = len(df)
    return base

stats = _get_stats(df_raw)

def get_plotly_layout(extra: dict = {}) -> dict:
    is_dark = st.get_option("theme.base") == "dark"

    if is_dark:
        font_color  = "#CBD5E1"
        title_color = "#F1F5F9"
        muted_color = "#94A3B8"
        grid_color  = "rgba(255,255,255,0.07)"
        zeroline    = "rgba(255,255,255,0.07)"
    else:
        font_color  = "#374151"
        title_color = "#111827"
        muted_color = "#6B7280"
        grid_color  = "rgba(0,0,0,0.06)"
        zeroline    = "rgba(0,0,0,0.06)"

    layout = dict(
        plot_bgcolor  = "rgba(0,0,0,0)",
        paper_bgcolor = "rgba(0,0,0,0)",
        font       = dict(family="Inter", color=font_color,  size=11),
        title_font = dict(family="Syne",  color=title_color, size=13),
        margin     = dict(t=40, b=30, l=10, r=10),
        xaxis      = dict(gridcolor=grid_color, zerolinecolor=zeroline, color=muted_color, automargin=True),
        yaxis      = dict(gridcolor=grid_color, zerolinecolor=zeroline, color=muted_color, automargin=True),
        coloraxis_colorbar = dict(
            tickfont = dict(color=muted_color),
            title    = dict(font=dict(color=muted_color)),
        ),
        legend = dict(font=dict(color=font_color), bgcolor="rgba(0,0,0,0)"),
    )
    layout.update(extra)
    return layout

PLOTLY_CONFIG = dict(responsive=True, displayModeBar=False)

# ─── Topbar ───────────────────────────────────────────────────────────────────
st.markdown(f"""
<div class="topbar">
    <div class="topbar-brand">🧠 CortiSoul <span>NLP · Kesehatan Mental · Bahasa Indonesia</span></div>
    <div class="topbar-info">
        <div class="topbar-stat">📦 <b>{stats['total_data_awal']:,}</b> Data (Terjemahan)</div>
        <div class="topbar-stat">🏷️ <b>7 Kelas</b></div>
        <div class="topbar-stat">🏆 <b>Word2Vec + LinearSVC</b></div>
        <div class="topbar-stat">🎯 Akurasi <b>82.9%</b> &nbsp;|&nbsp; F1 <b>0.851</b></div>
    </div>
</div>
""", unsafe_allow_html=True)

# ─── Navigasi Horizontal ──────────────────────────────────────────────────────
pages = ["🏠 Overview", "📂 Dataset", "📊 Distribusi Data", "🔍 Analisis Token", "🤖 Performa Model", "🧪 A/B Testing", "📋 Kesimpulan"]
if "page" not in st.session_state:
    st.session_state.page = "🏠 Overview"

st.markdown('<div class="nav-scroll-wrap">', unsafe_allow_html=True)
col_nav = st.columns(len(pages))
for col, p in zip(col_nav, pages):
    with col:
        if st.button(p, key=p, use_container_width=True,
                     type="primary" if st.session_state.page == p else "secondary"):
            st.session_state.page = p
            st.rerun()
st.markdown('</div>', unsafe_allow_html=True)

page = st.session_state.page

# ─── Konten Utama ─────────────────────────────────────────────────────────────

if page == "🏠 Overview":

    st.markdown('<div class="main-title">CortiSoul Dashboard</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Analisis NLP Teks Journaling untuk Deteksi Kondisi Kesehatan Mental Berbahasa Indonesia</div>', unsafe_allow_html=True)

    col1, col2, col3, col4 = st.columns(4)
    with col1: st.metric("Data Awal (Terjemahan)", f"{stats['total_data_awal']:,}", "dari 103.488 data asli")
    with col2: st.metric("Kondisi Mental", "7 Kelas", "multi-label")
    with col3: st.metric("Akurasi Terbaik", "82.9%", "✅ Tercapai")
    with col4: st.metric("F1-Score Macro", "0.851", "✅ ≥ 0.75")

    if df_raw is not None:
        r, c = df_raw.shape
        ci1, ci2, ci3, ci4 = st.columns(4)
        with ci1:
            st.markdown(f"""
            <div style="background:var(--card-bg);border-radius:12px;padding:0.65rem 0.85rem;
                        border:1px solid var(--border);box-shadow:0 2px 8px var(--card-shadow);">
                <div style="font-size:0.68rem;font-weight:600;color:var(--muted);
                            text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.25rem;">
                    File Dataset
                </div>
                <div style="font-size:0.82rem;font-weight:700;color:var(--text);
                            word-break:break-all;line-height:1.4;">
                    📄 {data_filename}
                </div>
            </div>
            """, unsafe_allow_html=True)
        with ci2: st.metric("Data Setelah Preprocessing", f"{r:,}")
        with ci3: st.metric("Jumlah Kolom", c)
        with ci4: st.metric("Missing Values", int(df_raw.isnull().sum().sum()))
    else:
        ci1, ci2, ci3, ci4 = st.columns(4)
        with ci1: st.metric("Data Awal (Terjemahan)", f"{stats['total_data_awal']:,}", "dari 103.488 data asli")
        with ci2: st.metric("Data Setelah Preprocessing", f"{stats['total_data']:,}")
        with ci3: st.metric("Jumlah Kolom", "10", "text, status, + 8 lainnya")
        with ci4: st.metric("Missing Values", "27", "tersebar di 6 kolom")
        st.warning("⚠️ File data tidak ditemukan di folder `../data/`. Letakkan `data_setelah_Preprocessing.csv` di sana.")

    st.markdown('<div class="section-header">Gambaran Proyek</div>', unsafe_allow_html=True)

    col_l, col_r = st.columns([1, 1])
    with col_l:
        st.markdown("""
        <div class="insight-box">
        <b>🎯 Tujuan Proyek:</b> CortiSoul mengembangkan sistem berbasis Natural Language Processing (NLP)
        untuk menganalisis teks journaling berbahasa Indonesia guna mendeteksi kondisi emosional dan
        tingkat stres pengguna secara otomatis.
        </div>

        <div class="insight-box">
        <b>📦 Dataset:</b> Mental Health Condition Classification Dataset (103.488 data asli) yang diterjemahkan ke Bahasa Indonesia
        menghasilkan <b>9.163 entri</b>. Setelah proses cleaning dan preprocessing menggunakan Sastrawi, tersisa
        <b>9.151 entri</b> dengan 10 kolom dan 7 label kondisi mental: Anxiety, Normal, Depression, Stress,
        Personality Disorder, Bipolar, dan Suicidal.
        </div>

        <div class="insight-box">
        <b>⚙️ Pipeline NLP:</b> Preprocessing (Sastrawi stemmer) → Tokenisasi → Word Embedding
        (Word2Vec/FastText, vector_size=100, window=5) → Klasifikasi (LinearSVC & Random Forest)
        </div>
        """, unsafe_allow_html=True)

    with col_r:
        df_dist = pd.DataFrame({
            'Kondisi': list(label_dist.keys()),
            'Jumlah':  list(label_dist.values()),
        })
        fig = px.pie(
            df_dist, values='Jumlah', names='Kondisi', hole=0.5,
            color_discrete_sequence=['#0D9488','#10B981','#06B6D4','#0891B2','#F59E0B','#EF4444','#8B5CF6'],
        )
        fig.update_layout(**get_plotly_layout(extra=dict(
            showlegend=True,
            title=dict(text='Distribusi Kondisi Mental', font=dict(family='Syne', size=13, color='#0D9488'), x=0.5),
            legend=dict(orientation="v", font=dict(size=11, color='#6B7280'), bgcolor='rgba(0,0,0,0)'),
            height=280,
            margin=dict(t=30, b=10, l=10, r=10),
        )))
        fig.update_traces(
            textinfo='percent',
            hovertemplate='<b>%{label}</b><br>%{value} data<br>%{percent}',
            marker=dict(line=dict(color='rgba(255,255,255,0.3)', width=2)),
        )
        st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CONFIG)

    st.markdown('<div class="section-header">Alur Metodologi</div>', unsafe_allow_html=True)
    steps  = ["📥 Gathering Data", "🔍 Assessing Data", "🧹 Cleaning Data", "⚙️ Preprocessing", "📊 EDA & Analisis Token", "🤖 Modeling", "📈 Evaluasi", "🧪 A/B Testing"]
    colors = ["#0D9488", "#10B981", "#06B6D4", "#0891B2", "#059669", "#F59E0B", "#EF4444", "#FFA5D6"]
    steps_html = "".join([
        f'<div style="text-align:center;background:{c}22;border-radius:10px;padding:10px 8px;'
        f'border:1px solid {c}44;font-size:clamp(0.68rem,1.4vw,0.78rem);font-weight:600;color:{c};'
        f'letter-spacing:0.01em;min-width:0;">{s}</div>'
        for s, c in zip(steps, colors)
    ])
    st.markdown(
        f'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px;">'
        f'{steps_html}</div>',
        unsafe_allow_html=True
    )


elif page == "📂 Dataset":

    _ds_title = data_filename if data_filename else "data_setelah_Preprocessing.csv"
    st.markdown(f"## 📂 Dataset — {_ds_title}")

    if df_raw is None:
        st.error("❌ File tidak ditemukan di folder `../data/`. Pastikan `data_setelah_Preprocessing.csv` ada di sana.")
        d1, d2, d3, d4 = st.columns(4)
        with d1: st.metric("Total Entri (Awal)", "9,163", "sebelum cleaning")
        with d2: st.metric("Total Kolom", "10")
        with d3: st.metric("Jumlah Kelas", "7")
        with d4: st.metric("Missing Values", "27", "tersebar di 6 kolom")
    else:
        r, c = df_raw.shape
        d1, d2, d3, d4 = st.columns(4)
        with d1: st.metric("Total Baris", f"{r:,}")
        with d2: st.metric("Total Kolom", c)
        with d3:
            label_col = next((col for col in df_raw.columns if col.lower() in
                              ["status","label","kondisi","condition","target"]), None)
            st.metric("Jumlah Kelas", df_raw[label_col].nunique() if label_col else "—")
        with d4: st.metric("Missing Values", int(df_raw.isnull().sum().sum()))

        st.markdown('<div class="section-header">Pratinjau Data</div>', unsafe_allow_html=True)

        fc1, fc2 = st.columns([2, 1])
        with fc1:
            cari = st.text_input("🔍 Cari teks:", placeholder="Ketik kata kunci...")
        with fc2:
            if label_col:
                opts = ["Semua"] + sorted(df_raw[label_col].dropna().unique().tolist())
                filter_kelas = st.selectbox(f"Filter {label_col}:", opts)
            else:
                filter_kelas = "Semua"

        df_view = df_raw.copy()
        if cari:
            mask = df_view.apply(lambda col: col.astype(str).str.contains(cari, case=False, na=False)).any(axis=1)
            df_view = df_view[mask]
        if filter_kelas != "Semua" and label_col:
            df_view = df_view[df_view[label_col] == filter_kelas]

        st.caption(f"Menampilkan **{len(df_view):,}** dari **{r:,}** baris")
        st.dataframe(df_view, use_container_width=True, height=400)

        st.markdown('<div class="section-header">Statistik Deskriptif</div>', unsafe_allow_html=True)
        num_cols = df_raw.select_dtypes(include="number").columns.tolist()
        if num_cols:
            st.dataframe(df_raw[num_cols].describe().T.round(3), use_container_width=True)
        else:
            st.info("Tidak ada kolom numerik — semua kolom bertipe teks/kategori.")

        st.markdown('<div class="section-header">Missing Values per Kolom</div>', unsafe_allow_html=True)
        mv = df_raw.isnull().sum().reset_index()
        mv.columns = ["Kolom", "Missing"]
        mv["Tipe Data"]   = df_raw.dtypes.values.astype(str)
        mv["Persentase"]  = (mv["Missing"] / r * 100).round(2).astype(str) + "%"
        st.dataframe(mv, use_container_width=True, hide_index=True)

        st.markdown('<div class="section-header">Insight Dataset</div>', unsafe_allow_html=True)

        total_missing  = int(df_raw.isnull().sum().sum())
        total_duplikat = int(df_raw.duplicated().sum())
        vc = df_raw[label_col].value_counts() if label_col else None

        if total_missing == 0:
            st.markdown('<div class="success-box">✅ <b>Tidak ada missing values</b> — dataset bersih secara struktural, tidak diperlukan imputasi data.</div>', unsafe_allow_html=True)
        else:
            kolom_missing = df_raw.columns[df_raw.isnull().any()].tolist()
            st.markdown(f'<div class="warning-box">⚠️ <b>Ditemukan {total_missing:,} missing values</b> pada kolom: <b>{", ".join(kolom_missing)}</b>. Perlu penanganan sebelum pemodelan.</div>', unsafe_allow_html=True)

        if total_duplikat == 0:
            st.markdown('<div class="success-box">✅ <b>Tidak ada data duplikat</b> — setiap baris unik.</div>', unsafe_allow_html=True)
        else:
            st.markdown(f'<div class="warning-box">⚠️ <b>{total_duplikat:,} baris duplikat</b> ditemukan — sebaiknya dihapus sebelum pemodelan agar tidak bias.</div>', unsafe_allow_html=True)

        if vc is not None:
            kelas_max = vc.index[0];  kelas_min = vc.index[-1]
            n_max     = int(vc.iloc[0]); n_min = int(vc.iloc[-1])
            rasio     = n_max / n_min if n_min > 0 else 0
            if rasio > 3:
                st.markdown(f'<div class="warning-box">⚠️ <b>Class imbalance signifikan</b> (rasio 1:{rasio:.1f}): kelas <i>{kelas_max}</i> ({n_max:,} data) vs <i>{kelas_min}</i> ({n_min:,} data). Disarankan menggunakan SMOTE atau stratified sampling sebelum pemodelan.</div>', unsafe_allow_html=True)
            elif rasio > 1.5:
                st.markdown(f'<div class="insight-box">📊 <b>Class imbalance ringan</b> (rasio 1:{rasio:.1f}): kelas <i>{kelas_max}</i> ({n_max:,}) vs <i>{kelas_min}</i> ({n_min:,}). Model masih bisa dilatih langsung namun perlu dipantau F1 per kelas.</div>', unsafe_allow_html=True)
            else:
                st.markdown('<div class="success-box">✅ <b>Distribusi kelas seimbang</b> — tidak diperlukan teknik resampling khusus.</div>', unsafe_allow_html=True)

        text_col = next((c for c in df_raw.columns if c.lower() in ["text","teks","clean_text","text_preprocessed","content"]), None)
        if text_col:
            n_unik   = df_raw[text_col].nunique()
            pct_unik = n_unik / r * 100
            if pct_unik >= 99:
                st.markdown(f'<div class="success-box">✅ <b>Teks hampir seluruhnya unik</b>: {n_unik:,} dari {r:,} baris ({pct_unik:.1f}%) — redundansi data sangat rendah.</div>', unsafe_allow_html=True)
            else:
                st.markdown(f'<div class="insight-box">📝 <b>Keunikan teks:</b> {n_unik:,} dari {r:,} baris unik ({pct_unik:.1f}%). Terdapat {r - n_unik:,} teks yang kemungkinan duplikat atau sangat mirip.</div>', unsafe_allow_html=True)

        st.markdown('<div class="section-header">Download</div>', unsafe_allow_html=True)
        csv_bytes = df_view.to_csv(index=False).encode("utf-8")
        st.download_button(
            label=f"⬇️ Download data yang ditampilkan ({len(df_view):,} baris) sebagai CSV",
            data=csv_bytes,
            file_name=f"cortisoul_filtered_{len(df_view)}_rows.csv",
            mime="text/csv",
        )


elif page == "📊 Distribusi Data":

    st.markdown("## 📊 Distribusi & Statistik Data")

    _src_note = "" if df_raw is not None else " *(fallback: data notebook)*"
    df_dist = pd.DataFrame({
        'Kondisi': list(label_dist.keys()),
        'Jumlah':  list(label_dist.values()),
    }).sort_values('Jumlah', ascending=True)

    fig = px.bar(
        df_dist, x='Jumlah', y='Kondisi', orientation='h',
        color='Jumlah', color_continuous_scale='Blues',
        labels={'Jumlah': 'Jumlah Entri', 'Kondisi': 'Kondisi Mental'},
        title=f'Distribusi Kondisi Mental dalam Dataset{_src_note}'
    )
    fig.update_layout(**get_plotly_layout(extra=dict(
        coloraxis_showscale=False,
        height=400,
        xaxis_range=[0, max(label_dist.values()) * 1.18],
        margin=dict(t=50, b=30, l=10, r=20),
    )))
    fig.update_traces(
        text=df_dist['Jumlah'], textposition='outside',
        hovertemplate='<b>%{y}</b><br>Jumlah: %{x}<extra></extra>'
    )
    st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CONFIG)

    st.markdown('<div class="section-header">Statistik Panjang Teks</div>', unsafe_allow_html=True)

    col1, col2, col3, col4, col5 = st.columns(5)
    with col1: st.metric("Data Awal (Terjemahan)", f"{stats['total_data_awal']:,}", "sebelum cleaning")
    with col2: st.metric("Setelah Preprocessing", f"{stats['total_data']:,}", "12 duplikat dihapus")
    with col3: st.metric("Panjang Min", f"{stats['min_panjang']} karakter")
    with col4: st.metric("Median Panjang", f"{stats['median_panjang']} karakter")
    with col5: st.metric("Rata-rata Panjang", f"{stats['mean_panjang']} karakter")

    _text_col = None
    if df_raw is not None:
        _text_col = next(
            (c for c in df_raw.columns if c.lower() in ['text','teks','clean_text','text_preprocessed','content']),
            None
        )

    if _text_col:
        _lengths = df_raw[_text_col].dropna().astype(str).apply(len)
        _median  = int(_lengths.median())
        _mean    = int(_lengths.mean())
        _hist_x  = _lengths.values
        _title   = 'Distribusi Panjang Teks (Data Aktual)'
    else:
        np.random.seed(42)
        _hist_x = np.clip(np.concatenate([
            np.random.exponential(150, 7000),
            np.random.normal(800, 300, 2000),
        ]), 4, 5902)
        _median = stats['median_panjang']
        _mean   = stats['mean_panjang']
        _title  = 'Distribusi Panjang Teks (Estimasi berdasarkan statistik notebook)'

    fig2 = go.Figure()
    fig2.add_trace(go.Histogram(
        x=_hist_x, nbinsx=60, name='Distribusi Panjang Teks',
        marker_color='#6C63FF', opacity=0.75,
    ))
    fig2.add_vline(x=_median, line_dash="dash", line_color="#FF6B6B",
                   annotation_text=f"Median: {_median}", annotation_position="top right")
    fig2.add_vline(x=_mean,   line_dash="dot",  line_color="#45B7D1",
                   annotation_text=f"Mean: {_mean}",   annotation_position="top left")
    fig2.update_layout(**get_plotly_layout(extra=dict(
        title=_title,
        xaxis_title='Panjang Teks (karakter)',
        yaxis_title='Frekuensi',
        height=350,
    )))
    st.plotly_chart(fig2, use_container_width=True, config=PLOTLY_CONFIG)

    st.markdown('<div class="section-header">Temuan Assessing Data</div>', unsafe_allow_html=True)
    _kelas_max = max(label_dist, key=label_dist.get)
    _kelas_min = min(label_dist, key=label_dist.get)
    _n_max     = label_dist[_kelas_max]; _n_min = label_dist[_kelas_min]
    _rasio     = _n_max / _n_min if _n_min > 0 else 0
    _med       = stats['median_panjang']; _mean_val = stats['mean_panjang']
    _min_p     = stats['min_panjang'];   _max_p    = stats['max_panjang']

    st.markdown(f"""
    <div class="warning-box">⚠️ <b>27 missing values</b> tersebar di 6 kolom: <i>clean_text</i>, <i>lower</i>, <i>normalized</i> (masing-masing 1), serta <i>text_no_stopword</i>, <i>text_stemmed</i>, <i>text_preprocessed</i> (masing-masing 8) — berasal dari 8 baris yang gagal diproses saat stemming/stopword removal.</div>
    <div class="warning-box">⚠️ <b>12 data duplikat</b> ditemukan dari total 9.163 data (sebelum cleaning) — dihapus pada tahap cleaning, tersisa 9.151 data. Selain itu terdapat <b>68 duplikat teks</b> pada kolom tokens.</div>
    <div class="insight-box">📏 <b>Variasi panjang teks tinggi:</b> Min {_min_p} karakter hingga {_max_p:,} karakter. Median ({_med}) jauh di bawah mean ({_mean_val}), menunjukkan distribusi right-skewed.</div>
    <div class="insight-box">📊 <b>Distribusi kelas:</b> Suicidal ({label_dist.get('suicidal',0):,}, 18.1%) paling banyak, Bipolar ({label_dist.get('bipolar',0):,}, 10.6%) paling sedikit. Rasio imbalance ringan → tidak perlu SMOTE.</div>
    """, unsafe_allow_html=True)

    st.markdown('<div class="section-header">Visualisasi dari Notebook</div>', unsafe_allow_html=True)
    dist_tabs = st.tabs(["📊 Distribusi Kelas", "📏 Panjang Teks", "📦 Boxplot per Kondisi", "🔠 Top-20 Kata"])
    with dist_tabs[0]: show_nb_image("distribusi_kondisi_mental.png")
    with dist_tabs[1]: show_nb_image("eda_distribusi_panjang.png", "Distribusi panjang teks")
    with dist_tabs[2]: show_nb_image("eda_boxplot_panjang_per_kondisi.png", "Boxplot panjang teks per kondisi mental")
    with dist_tabs[3]: show_nb_image("eda_top20_kata.png", "Top-20 kata paling sering muncul di dataset")


elif page == "🔍 Analisis Token":

    st.markdown("## 🔍 Analisis Token")

    tab1, tab2 = st.tabs(["🔤 Top-3 Token per Kondisi (Word2Vec)", "🔑 Token Eksklusif per Kondisi"])

    with tab1:
        st.markdown("#### Top-3 Token Representatif per Kondisi Mental")
        st.markdown(
            "Token dihasilkan dari **Word2Vec `most_similar()`** — menggunakan 5 kata frekuensi tertinggi "
            "per kondisi sebagai anchor, lalu dicari 10 kata paling mirip secara semantik di ruang vektor."
        )

        kondisi_colors = {
            'anxiety': '#0D9488', 'bipolar': '#8B5CF6', 'depression': '#0891B2',
            'normal': '#10B981', 'personality disorder': '#F59E0B',
            'stress': '#EF4444', 'suicidal': '#6B7280',
        }

        rows_w2v = []
        for kondisi, tokens in top3_w2v.items():
            rows_w2v.append({
                'Kondisi':      kondisi.title(),
                'Top-1 (W2V)': tokens[0], 'Top-2 (W2V)': tokens[1], 'Top-3 (W2V)': tokens[2],
                'Top-1 (FT)':  top3_ft[kondisi][0], 'Top-2 (FT)': top3_ft[kondisi][1], 'Top-3 (FT)': top3_ft[kondisi][2],
            })
        df_top3 = pd.DataFrame(rows_w2v)
        st.dataframe(df_top3, use_container_width=True, hide_index=True)

        st.markdown('<div class="section-header">Visualisasi Token per Kondisi</div>', unsafe_allow_html=True)

        x_labels = []; y_vals = []; colors_bar = []; text_labels = []
        for kondisi, tokens in top3_w2v.items():
            for rank, token in enumerate(tokens, 1):
                x_labels.append(kondisi.title())
                y_vals.append(token)
                colors_bar.append(kondisi_colors.get(kondisi, '#6B7280'))
                text_labels.append(f"#{rank}: {token}")

        fig_grid = go.Figure(go.Bar(
            x=x_labels,
            y=[3 - (i % 3) for i in range(len(x_labels))],
            text=y_vals, textposition='inside',
            marker_color=colors_bar,
            hovertext=text_labels, hoverinfo='text',
        ))

        fig_grid.update_layout(**get_plotly_layout(extra=dict(
            title='Top-3 Token Word2Vec per Kondisi Mental',
            xaxis_title='Kondisi Mental',
            barmode='stack',
            height=380,
            showlegend=False,
        )))
        fig_grid.update_yaxes(showticklabels=False, title='Rank')
        st.plotly_chart(fig_grid, use_container_width=True, config=PLOTLY_CONFIG)

        st.markdown("""
        <div class="insight-box">
        Token diperoleh dari <b>Word2Vec <code>most_similar()</code></b> menggunakan anchor kata frekuensi tertinggi per kondisi.
        Hasilnya mencerminkan konteks semantik masing-masing kondisi — misalnya <i>stress</i> identik dengan
        tekanan eksternal (<i>wajib</i>, <i>tenggat</i>, <i>rentet</i>), sementara <i>normal</i> didominasi
        kata-kata santai seperti <i>meme</i>, <i>anime</i>, dan <i>telusur</i>.
        </div>
        """, unsafe_allow_html=True)

    with tab2:
        st.markdown("#### Token Eksklusif per Kondisi Mental")
        st.markdown("Token eksklusif adalah kata yang hanya muncul signifikan di satu kondisi tertentu.")

        kondisi_pilihan = st.selectbox(
            "Pilih kondisi mental:", list(token_eksklusif.keys()),
            format_func=lambda x: x.title()
        )

        tokens      = token_eksklusif[kondisi_pilihan]
        n_eksklusif = len(tokens)

        col1, col2 = st.columns([1, 2])
        with col1:
            st.metric("Jumlah Token Eksklusif", n_eksklusif)
            if n_eksklusif >= 8:
                st.markdown('<div class="success-box">✅ Kondisi ini memiliki banyak ciri khas linguistik — lebih mudah diklasifikasikan.</div>', unsafe_allow_html=True)
            elif n_eksklusif <= 6:
                st.markdown('<div class="warning-box">⚠️ Token eksklusif sedikit (6 token) — kondisi ini lebih sulit dibedakan karena tumpang tindih semantik dengan kondisi lain.</div>', unsafe_allow_html=True)
            else:
                st.markdown('<div class="insight-box">📝 Jumlah token eksklusif moderat — cukup untuk membedakan kondisi ini.</div>', unsafe_allow_html=True)
        with col2:
            st.markdown("**Token eksklusif:**")
            tags_html = "".join([f'<span class="tag">{t}</span>' for t in tokens])
            st.markdown(tags_html, unsafe_allow_html=True)

        st.divider()
        st.markdown("#### Perbandingan Jumlah Token Eksklusif Semua Kondisi")
        df_eksklusif = pd.DataFrame({
            'Kondisi':                list(token_eksklusif.keys()),
            'Jumlah Token Eksklusif': [len(v) for v in token_eksklusif.values()],
        }).sort_values('Jumlah Token Eksklusif', ascending=False)

        colors_bar2 = ['#2ECC71' if n >= 5 else '#FF9F45' if n >= 3 else '#E74C3C'
                       for n in df_eksklusif['Jumlah Token Eksklusif']]

        fig2 = go.Figure(go.Bar(
            x=df_eksklusif['Kondisi'],
            y=df_eksklusif['Jumlah Token Eksklusif'],
            marker_color=colors_bar2,
            text=df_eksklusif['Jumlah Token Eksklusif'],
            textposition='outside',
        ))

        fig2.update_layout(**get_plotly_layout(extra=dict(
            title='Jumlah Token Eksklusif per Kondisi Mental',
            xaxis_title='Kondisi',
            yaxis_title='Jumlah Token Eksklusif',
            yaxis_range=[0, 13],
            height=360,
            margin=dict(t=50, b=40, l=50, r=20),
        )))
        st.plotly_chart(fig2, use_container_width=True, config=PLOTLY_CONFIG)

        st.markdown("""
        <div class="success-box">✅ <b>Anxiety</b> adalah kondisi yang paling mudah dibedakan (10 token eksklusif).</div>
        <div class="warning-box">⚠️ <b>Depression</b> (F1 0.636) dan <b>Suicidal</b> (F1 0.661) adalah kondisi yang paling sulit dibedakan — hanya 6 token eksklusif, sehingga pola bahasanya sangat mirip dan sering tumpang tindih satu sama lain.</div>
        """, unsafe_allow_html=True)

    st.markdown('<div class="section-header">Visualisasi dari Notebook</div>', unsafe_allow_html=True)
    nb_img_tabs = st.tabs(["☁️ Word Cloud","🗺️ Heatmap Overlap (W2V)","🗺️ Heatmap Overlap (FT)","📊 Top-10 Word2Vec","📊 Top-10 FastText","🔑 Token Eksklusif (W2V)","🔑 Token Eksklusif (FT)","📈 Top-20 Kata"])
    with nb_img_tabs[0]: show_nb_image("wordcloud_kondisi_mental.png", "Word Cloud per kondisi mental (7 kondisi)")
    with nb_img_tabs[1]: show_nb_image("explain_A1_heatmap_overlap_token_w2v.png", "Heatmap overlap token antar kondisi — Word2Vec")
    with nb_img_tabs[2]: show_nb_image("explain_A1_heatmap_overlap_token_ft.png", "Heatmap overlap token antar kondisi — FastText")
    with nb_img_tabs[3]: show_nb_image("explain_A2_top10_w2v_grid.png", "Bar chart top-10 token Word2Vec per kondisi")
    with nb_img_tabs[4]: show_nb_image("explain_A2_top10_ft_grid.png", "Bar chart top-10 token FastText per kondisi")
    with nb_img_tabs[5]: show_nb_image("explain_A3_token_eksklusif_w2v.png", "Jumlah token eksklusif per kondisi — Word2Vec")
    with nb_img_tabs[6]: show_nb_image("explain_A3_token_eksklusif_ft.png", "Jumlah token eksklusif per kondisi — FastText")
    with nb_img_tabs[7]: show_nb_image("eda_top20_kata.png", "Top-20 kata paling sering muncul di seluruh dataset")


elif page == "🤖 Performa Model":

    st.markdown("## 🤖 Evaluasi Performa Model")

    tab1, tab2, tab3 = st.tabs(["🏆 Perbandingan Model", "📈 F1-Score per Kelas", "🔍 Analisis Kesalahan"])

    with tab1:
        st.markdown("#### Rekap Performa Semua Kombinasi Model")

        model_performance['Label']  = model_performance['Representasi Vektor'] + ' + ' + model_performance['Model Klasifikasi']
        model_performance['Target'] = model_performance['Akurasi'] >= 0.80

        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=('Akurasi (%)', 'F1-Score Macro'),
            horizontal_spacing=0.12,
        )
        colors_mp = ['#2ECC71' if t else '#E74C3C' for t in model_performance['Target']]

        fig.add_trace(go.Bar(
            x=model_performance['Label'], y=model_performance['Akurasi'] * 100,
            name='Akurasi', marker_color=colors_mp,
            text=[f"{v*100:.1f}%" for v in model_performance['Akurasi']],
            textposition='outside',
        ), row=1, col=1)

        fig.add_trace(go.Bar(
            x=model_performance['Label'], y=model_performance['F1 Macro'],
            name='F1 Macro', marker_color=['#4ECDC4'] * 4,
            text=[f"{v:.4f}" for v in model_performance['F1 Macro']],
            textposition='outside',
        ), row=1, col=2)

        fig.add_hline(y=80,   line_dash="dash", line_color="#EF4444", row=1, col=1,
                      annotation_text="Target 80%",
                      annotation_position="top left",
                      annotation_font=dict(color="#EF4444", size=11, family="Syne"))
        fig.add_hline(y=0.75, line_dash="dash", line_color="#EF4444", row=1, col=2,
                      annotation_text="Target F1 ≥ 0.75",
                      annotation_position="top left",
                      annotation_font=dict(color="#EF4444", size=11, family="Syne"))

        _muted    = "#6B7280"
        _text_col = "#374151"
        _title_c  = "#0D9488"
        _grid     = "rgba(128,128,128,0.12)"

        fig.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(family='Inter', color=_text_col, size=12),
            height=430, showlegend=False,
            margin=dict(t=40, b=10, l=10, r=20),
            xaxis =dict(gridcolor=_grid, color=_muted),
            yaxis =dict(gridcolor=_grid, color=_muted, range=[0, 95]),
            xaxis2=dict(gridcolor=_grid, color=_muted),
            yaxis2=dict(gridcolor=_grid, color=_muted, range=[0, 1.0]),
        )
        fig.update_annotations(font=dict(family='Syne', color=_title_c, size=13))
        fig.update_xaxes(tickangle=15, tickfont_size=11)
        st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CONFIG)

        st.markdown("#### Tabel Rekap")
        df_show = model_performance[['Label', 'Akurasi', 'F1 Macro', 'Target']].copy()
        df_show['Akurasi']  = (df_show['Akurasi'] * 100).round(2).astype(str) + '%'
        df_show['F1 Macro'] = df_show['F1 Macro'].round(4)
        df_show['Target']   = df_show['Target'].map({True: '✅ Tercapai', False: '❌ Belum'})
        df_show.columns     = ['Model', 'Akurasi (%)', 'F1 Macro', 'Target ≥80%']
        st.dataframe(df_show, hide_index=True, use_container_width=True)

        st.markdown("""
        <div class="success-box">✅ <b>Semua model</b> mencapai akurasi di atas 80% dan F1 Macro ≥ 0.75 — kedua target penelitian terpenuhi.</div>
        <div class="insight-box">🏆 <b>Model terbaik:</b> Word2Vec + LinearSVC dengan akurasi <b>82.9%</b> dan F1 Macro <b>0.851</b>. Word2Vec + Random Forest memiliki F1 yang sama (0.851) namun akurasi sedikit lebih rendah (82.6%).</div>
        """, unsafe_allow_html=True)

    with tab2:
        st.markdown("#### F1-Score per Kondisi Mental (Model Terbaik: Word2Vec + LinearSVC)")

        df_f1 = pd.DataFrame({
            'Kondisi':  list(f1_per_kelas.keys()),
            'F1 Score': list(f1_per_kelas.values()),
        }).sort_values('F1 Score', ascending=True)

        colors_f1 = ['#E74C3C' if v < 0.75 else '#2ECC71' if v >= 0.85 else '#FF9F45'
                     for v in df_f1['F1 Score']]

        fig3 = go.Figure(go.Bar(
            x=df_f1['F1 Score'], y=df_f1['Kondisi'], orientation='h',
            marker_color=colors_f1,
            text=[f"{v:.2f}" for v in df_f1['F1 Score']],
            textposition='outside',
        ))
        fig3.add_vline(x=0.75, line_dash="dash", line_color="#EF4444",
                       annotation_text="Target F1 ≥ 0.75",
                       annotation_position="top right",
                       annotation_font=dict(color="#EF4444", size=11, family="Syne"))

        fig3.update_layout(**get_plotly_layout(extra=dict(
            title='F1-Score per Kondisi — Word2Vec + LinearSVC',
            xaxis_title='F1 Score',
            xaxis_range=[0, 1.1],
            height=380,
        )))
        st.plotly_chart(fig3, use_container_width=True, config=PLOTLY_CONFIG)

        st.markdown("""
        <div class="success-box">✅ <b>Bipolar</b> memiliki F1-score tertinggi (0.985) — paling mudah diklasifikasikan. Diikuti Personality Disorder (0.979) dan Stress (0.977).</div>
        <div class="warning-box">⚠️ <b>Depression</b> (F1 0.636) dan <b>Suicidal</b> (F1 0.661) berada di bawah target 0.75 — kedua kondisi ini paling sering tertukar dan perlu penanganan tambahan seperti <b>SMOTE</b> atau augmentasi data.</div>
        """, unsafe_allow_html=True)

    with tab3:
        st.markdown("#### Pasangan Kondisi yang Paling Sering Tertukar")
        st.dataframe(confusion_pairs, hide_index=True, use_container_width=True)

        fig4 = px.scatter(
            confusion_pairs, x='Aktual', y='Prediksi',
            size='Jumlah', color='Jumlah',
            color_continuous_scale='Reds',
            title='Pola Kesalahan Klasifikasi (ukuran = frekuensi)',
            size_max=50,
        )

        fig4.update_layout(**get_plotly_layout(extra=dict(height=380)))
        st.plotly_chart(fig4, use_container_width=True, config=PLOTLY_CONFIG)

        st.markdown("""
        <div class="warning-box">⚠️ <b>Depression ↔ Suicidal</b> adalah pasangan paling sering tertukar:<br>
        &nbsp;&nbsp;• 466 kasus <i>depression</i> diprediksi sebagai <i>suicidal</i> (<b>28.5%</b> dari kelas depression)<br>
        &nbsp;&nbsp;• 415 kasus <i>suicidal</i> diprediksi sebagai <i>depression</i> (<b>25.1%</b> dari kelas suicidal)<br>
        Secara total, lebih dari <b>880 prediksi</b> tertukar di antara dua kelas ini.</div>
        <div class="insight-box">📊 <b>Normal</b> juga sering tertukar dengan depression (99 kasus, 8.0%) dan suicidal (96 kasus, 7.8%) — menunjukkan overlap semantik yang signifikan antara ketiga kelas ini.</div>
        """, unsafe_allow_html=True)

    st.markdown('<div class="section-header">Visualisasi dari Notebook</div>', unsafe_allow_html=True)
    img_tabs = st.tabs(["🧩 Confusion Matrix","📉 Akurasi & F1","🎯 F1 per Kelas","⚠️ Analisis Kesalahan","🗺️ PCA Cluster","⏱️ Waktu Training"])
    with img_tabs[0]: show_nb_image("confusion_matrix_semua_model.png", "Confusion matrix semua model (2×2 grid)")
    with img_tabs[1]: show_nb_image("explain_B1_perbandingan_akurasi_f1.png", "Perbandingan akurasi & F1 semua model")
    with img_tabs[2]: show_nb_image("explain_B2_f1_per_kelas.png", "F1-score per kelas — Word2Vec + LinearSVC (model terbaik)")
    with img_tabs[3]: show_nb_image("analisis_kesalahan.png", "Analisis kesalahan klasifikasi antar kondisi")
    with img_tabs[4]: show_nb_image("cluster_pca.png", "Visualisasi PCA cluster — representasi vektor Word2Vec vs FastText")
    with img_tabs[5]: show_nb_image("waktu_training_w2v_ft.png", "Waktu training Word2Vec vs FastText")


elif page == "🧪 A/B Testing":

    st.markdown("## 🧪 A/B Testing — Word2Vec vs FastText")

    st.markdown("""
    <div class="insight-box">
    <b>🎯 Tujuan A/B Testing:</b> Membandingkan dua metode word embedding dengan model yang <b>sama persis</b>
    (Logistic Regression, parameter identik, seed dikunci) agar perbedaan hasil murni berasal dari
    metode representasi teks, bukan dari model.<br><br>
    <b>Kondisi A:</b> Word2Vec + Logistic Regression &nbsp;|&nbsp; <b>Kondisi B:</b> FastText + Logistic Regression<br><br>
    ✅ <i>Hasil: <b>Word2Vec (Kondisi A) unggul di semua metrik</b> dan perbedaannya
    <b>signifikan secara statistik</b> (p = 0.0000). Ini konsisten dengan hasil eksperimen utama
    (<b>Word2Vec + LinearSVC</b> sebagai model terbaik).</i>
    </div>
    """, unsafe_allow_html=True)

    ab_results = pd.DataFrame({
        'Metrik':               ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
        'Kondisi A (Word2Vec)': [0.7995, 0.8002, 0.7995, 0.7998],
        'Kondisi B (FastText)': [0.7725, 0.7730, 0.7725, 0.7725],
        'Selisih (B - A)':      [-0.0270, -0.0272, -0.0270, -0.0273],
    })

    cr_A = pd.DataFrame({
        'Kondisi':   ['anxiety','bipolar','depression','normal','personality disorder','stress','suicidal'],
        'Precision': [0.93,0.98,0.60,0.70,0.96,0.96,0.63],
        'Recall':    [0.93,0.97,0.61,0.70,0.97,0.97,0.63],
        'F1':        [0.9320,0.9754,0.6030,0.6965,0.9624,0.9646,0.6295],
        'Support':   [238,193,327,247,247,247,331],
    })
    cr_B = pd.DataFrame({
        'Kondisi':   ['anxiety','bipolar','depression','normal','personality disorder','stress','suicidal'],
        'Precision': [0.91,0.97,0.55,0.64,0.96,0.95,0.60],
        'Recall':    [0.91,0.97,0.55,0.65,0.96,0.95,0.59],
        'F1':        [0.9133,0.9727,0.5496,0.6448,0.9591,0.9544,0.5949],
        'Support':   [238,193,327,247,247,247,331],
    })

    mcnemar_data = {
        'n11': 1354, 'n10': 282, 'n01': 11, 'n00': 184,
        'statistic': 72.1287, 'pvalue': 0.0000,
    }

    tab1, tab2, tab3 = st.tabs(["📊 Perbandingan Metrik", "📋 Laporan per Kelas", "🔬 Uji Statistik McNemar"])

    with tab1:
        st.markdown("#### Hasil Perbandingan Keseluruhan")

        m1, m2, m3, m4 = st.columns(4)
        with m1: st.metric("Akurasi — Word2Vec", "79.95%", "+2.70% vs FastText")
        with m2: st.metric("Akurasi — FastText", "77.25%")
        with m3: st.metric("F1-Score — Word2Vec", "0.7998", "+0.0273 vs FastText")
        with m4: st.metric("F1-Score — FastText", "0.7725")

        fig_ab = go.Figure()
        fig_ab.add_trace(go.Bar(
            name='Kondisi A — Word2Vec', x=ab_results['Metrik'], y=ab_results['Kondisi A (Word2Vec)'],
            marker_color='#0D9488',
            text=[f"{v:.4f}" for v in ab_results['Kondisi A (Word2Vec)']],
            textposition='outside',
        ))
        fig_ab.add_trace(go.Bar(
            name='Kondisi B — FastText', x=ab_results['Metrik'], y=ab_results['Kondisi B (FastText)'],
            marker_color='#F59E0B',
            text=[f"{v:.4f}" for v in ab_results['Kondisi B (FastText)']],
            textposition='outside',
        ))

        fig_ab.update_layout(**get_plotly_layout(extra=dict(
            barmode='group',
            title='Perbandingan Metrik — Word2Vec vs FastText (Logistic Regression)',
            yaxis_range=[0, 1.0],
            height=380,
        )))
        st.plotly_chart(fig_ab, use_container_width=True, config=PLOTLY_CONFIG)

        st.markdown("#### Tabel Ringkasan")
        df_show_ab = ab_results.copy()
        for col in ['Kondisi A (Word2Vec)', 'Kondisi B (FastText)', 'Selisih (B - A)']:
            df_show_ab[col] = df_show_ab[col].round(4)
        st.dataframe(df_show_ab, hide_index=True, use_container_width=True)

        st.markdown("""
        <div class="success-box">✅ <b>Word2Vec (Kondisi A) lebih unggul</b> dari FastText di semua metrik. Selisih F1-Score: <b>+3.53%</b> — dan perbedaan ini <b>signifikan secara statistik</b> (p = 0.0000 &lt; 0.05).</div>
        <div class="insight-box">💡 <b>Catatan penting:</b> Pada eksperimen Stratified 5-Fold CV dengan LinearSVC, Word2Vec juga lebih unggul (82.9% vs 82.1%). <b>Word2Vec + LinearSVC</b> tetap menjadi kombinasi terbaik secara keseluruhan.</div>
        """, unsafe_allow_html=True)

    with tab2:
        st.markdown("#### Classification Report per Kelas")

        col_a, col_b = st.columns(2)

        with col_a:
            st.markdown("**🔵 Kondisi A — Word2Vec + Logistic Regression**")
            fig_cr_a = go.Figure()
            for metric, color in [('Precision','#0D9488'),('Recall','#10B981'),('F1','#06B6D4')]:
                fig_cr_a.add_trace(go.Bar(
                    name=metric, x=cr_A['Kondisi'], y=cr_A[metric],
                    marker_color=color,
                    text=[f"{v:.2f}" for v in cr_A[metric]],
                    textposition='outside',
                ))

            fig_cr_a.update_layout(**get_plotly_layout(extra=dict(
                barmode='group', height=380, yaxis_range=[0,1.2], xaxis_tickangle=20,
            )))
            st.plotly_chart(fig_cr_a, use_container_width=True, config=PLOTLY_CONFIG)

        with col_b:
            st.markdown("**🟡 Kondisi B — FastText + Logistic Regression**")
            fig_cr_b = go.Figure()
            for metric, color in [('Precision','#F59E0B'),('Recall','#EF4444'),('F1','#8B5CF6')]:
                fig_cr_b.add_trace(go.Bar(
                    name=metric, x=cr_B['Kondisi'], y=cr_B[metric],
                    marker_color=color,
                    text=[f"{v:.2f}" for v in cr_B[metric]],
                    textposition='outside',
                ))

            fig_cr_b.update_layout(**get_plotly_layout(extra=dict(
                barmode='group', height=380, yaxis_range=[0,1.2], xaxis_tickangle=20,
            )))
            st.plotly_chart(fig_cr_b, use_container_width=True, config=PLOTLY_CONFIG)

        st.markdown("#### Perbandingan F1-Score per Kelas (A vs B)")
        fig_f1_cmp = go.Figure()
        fig_f1_cmp.add_trace(go.Bar(
            name='Word2Vec (A)', x=cr_A['Kondisi'], y=cr_A['F1'],
            marker_color='#0D9488',
            text=[f"{v:.2f}" for v in cr_A['F1']], textposition='outside',
        ))
        fig_f1_cmp.add_trace(go.Bar(
            name='FastText (B)', x=cr_B['Kondisi'], y=cr_B['F1'],
            marker_color='#F59E0B',
            text=[f"{v:.2f}" for v in cr_B['F1']], textposition='outside',
        ))
        fig_f1_cmp.add_vline(x=0.75, line_dash="dash", line_color="#EF4444",
                              annotation_text="Target F1 ≥ 0.75",
                              annotation_position="top right",
                              annotation_font=dict(color="#EF4444", size=11, family="Syne"))

        fig_f1_cmp.update_layout(**get_plotly_layout(extra=dict(
            barmode='group',
            title='F1-Score per Kelas — Word2Vec vs FastText',
            yaxis_range=[0, 1.2],
            height=380,
        )))
        st.plotly_chart(fig_f1_cmp, use_container_width=True, config=PLOTLY_CONFIG)

        st.markdown("""
        <div class="success-box">✅ <b>Word2Vec unggul di semua 7 kelas</b> — tidak ada satu pun kelas yang FastText lebih baik.</div>
        <div class="warning-box">⚠️ <b>Depression</b> dan <b>Suicidal</b> tetap menjadi kelas terlemah di kedua kondisi (F1 Word2Vec: 0.603 & 0.630; FastText bahkan lebih rendah: 0.550 & 0.595).</div>
        """, unsafe_allow_html=True)

    with tab3:
        st.markdown("#### Uji Statistik McNemar")
        st.markdown("McNemar Test digunakan untuk menguji apakah perbedaan performa antara dua model pada data yang sama bersifat **signifikan secara statistik**.")

        col_stat1, col_stat2 = st.columns([1, 1])

        with col_stat1:
            st.markdown("**Contingency Table**")
            ct = pd.DataFrame({
                'Prediksi':  ['A ✅ Benar', 'A ❌ Salah'],
                'B ✅ Benar': [mcnemar_data['n11'], mcnemar_data['n01']],
                'B ❌ Salah': [mcnemar_data['n10'], mcnemar_data['n00']],
            })
            st.dataframe(ct, hide_index=True, use_container_width=True)

            st.markdown(f"""
            <div style="margin-top:0.8rem;">
            <div style="font-size:0.85rem; color:var(--text-secondary); line-height:2;">
            • <b>A ✅ & B ✅ benar:</b> {mcnemar_data['n11']:,} sampel<br>
            • <b>A ✅ benar, B ❌ salah:</b> {mcnemar_data['n10']} sampel<br>
            • <b>A ❌ salah, B ✅ benar:</b> {mcnemar_data['n01']} sampel<br>
            • <b>A ❌ & B ❌ salah:</b> {mcnemar_data['n00']} sampel
            </div>
            </div>
            """, unsafe_allow_html=True)

        with col_stat2:
            st.markdown("**Hasil Uji McNemar**")
            pval    = mcnemar_data['pvalue']
            stat    = mcnemar_data['statistic']
            is_sig  = pval < 0.05

            color_verdict = "#10B981" if not is_sig else "#EF4444"
            bg_verdict    = "rgba(16,185,129,0.08)" if not is_sig else "rgba(239,68,68,0.08)"
            verdict_text  = "Tidak Signifikan (p ≥ 0.05)" if not is_sig else "Signifikan (p < 0.05)"
            verdict_icon  = "✅" if not is_sig else "⚠️"

            st.markdown(f"""
            <div style="background:{bg_verdict}; border:1px solid {color_verdict}40;
                        border-left:4px solid {color_verdict}; border-radius:14px;
                        padding:1.2rem 1.4rem; margin-top:0.5rem;">
                <div style="font-size:0.78rem; font-weight:600; color:var(--muted);
                            text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.8rem;">
                    Hasil McNemar Test
                </div>
                <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:0.8rem;">
                    <div>
                        <div style="font-size:0.72rem; color:var(--muted);">Statistik Chi²</div>
                        <div style="font-size:1.5rem; font-weight:700; color:var(--text);">{stat:.4f}</div>
                    </div>
                    <div>
                        <div style="font-size:0.72rem; color:var(--muted);">P-value</div>
                        <div style="font-size:1.5rem; font-weight:700; color:var(--text);">{pval:.4f}</div>
                    </div>
                </div>
                <div style="font-size:0.95rem; font-weight:700; color:{color_verdict};">
                    {verdict_icon} {verdict_text}
                </div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("""
        <div class="insight-box" style="margin-top:1rem;">
        <b>📊 Interpretasi:</b> Dengan p-value = <b>0.0000</b> (jauh di bawah threshold 0.05), perbedaan performa antara Word2Vec dan FastText <b>signifikan secara statistik</b>. Word2Vec terbukti lebih unggul.
        </div>
        <div class="success-box">
        🎯 <b>Rekomendasi Akhir:</b> Gunakan <b>Word2Vec + LinearSVC</b> untuk platform CortiSoul karena secara keseluruhan menghasilkan akurasi dan F1 tertinggi (82.9%, F1 0.851).
        </div>
        """, unsafe_allow_html=True)

        _GAUGE_NUM   = "#0D9488"
        _GAUGE_TICK  = "#6B7280"
        _GAUGE_TITLE = "#0D9488"
        _step_lo     = "rgba(239,68,68,0.30)"
        _step_hi     = "rgba(16,185,129,0.25)"  

        fig_pval = go.Figure(go.Indicator(
            mode="gauge+number",
            value=pval,
            title={'text': "P-value McNemar Test", 'font': {'color': _GAUGE_TITLE, 'family': 'Syne', 'size': 14}},
            number={
                'font': {'color': _GAUGE_NUM, 'size': 48, 'family': 'Syne'},
                'valueformat': '.3f',
                'suffix': '',
            },
            gauge={
                'axis': {
                    'range': [0, 1],
                    'tickvals': [0, 0.05, 0.2, 0.4, 0.6, 0.8, 1],
                    'ticktext': ['0', '0.05', '0.2', '0.4', '0.6', '0.8', '1'],
                    'tickcolor': _GAUGE_TICK,
                    'tickfont': {'color': _GAUGE_TICK, 'size': 11},
                },
                'bar':  {'color': '#0D9488'},
                'bgcolor': 'rgba(0,0,0,0)',
                'steps': [
                    {'range': [0, 0.05], 'color': _step_lo},
                    {'range': [0.05, 1], 'color': _step_hi},
                ],
                'threshold': {'line': {'color': '#EF4444', 'width': 3}, 'thickness': 0.75, 'value': 0.05},
            }
        ))
        fig_pval.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(family='Inter', color=_GAUGE_TICK, size=13),
            height=320,
            margin=dict(t=60, b=30, l=40, r=40),
        )

        fig_pval.update_traces(
            number_font_color=_GAUGE_NUM,
            title_font_color=_GAUGE_TITLE,
        )
        st.plotly_chart(fig_pval, use_container_width=True, config=PLOTLY_CONFIG)
        st.caption("Garis merah menunjukkan ambang batas signifikansi α = 0.05. P-value 0.0000 berada jauh di zona merah → perbedaan signifikan secara statistik.")
        show_nb_image("ab_testing_w2v_vs_ft.png", "Bar chart perbandingan metrik A/B Testing Word2Vec vs FastText")
        show_nb_image("ab_global_comparison.png", "Perbandingan metrik global A/B Testing — Word2Vec vs FastText")

    st.markdown('<div class="section-header">Confusion Matrix dari Notebook</div>', unsafe_allow_html=True)
    cm_tabs = st.tabs(["🔵 Confusion Matrix — Word2Vec", "🟡 Confusion Matrix — FastText"])
    with cm_tabs[0]: show_nb_image("cm_word2vec.png", "Confusion matrix — Kondisi A (Word2Vec + Logistic Regression)")
    with cm_tabs[1]: show_nb_image("cm_fasttext.png", "Confusion matrix — Kondisi B (FastText + Logistic Regression)")


elif page == "📋 Kesimpulan":

    st.markdown("## 📋 Kesimpulan & Rekomendasi")

    st.markdown('<div class="section-header">Jawaban Pertanyaan Penelitian</div>', unsafe_allow_html=True)

    with st.expander("❓ Pertanyaan 1: Pola Token per Kondisi Mental", expanded=True):
        st.markdown("""
        **Pertanyaan:** Token/frasa apa yang paling merepresentasikan masing-masing dari 7 kondisi mental, berdasarkan analisis **Word2Vec** dan **FastText** (top-10 kata paling mirip per kategori)?

        **Jawaban:**
        - Setiap kondisi mental memiliki token eksklusif yang menjadi ciri khasnya (diidentifikasi via Word2Vec `most_similar()`).
        - Dataset: **9.163 data** (terjemahan dari 103.488 data asli), diproses menjadi **9.151 entri** setelah cleaning & preprocessing Sastrawi.
        - **Anxiety** paling mudah dibedakan (10 token eksklusif: benak, lumpuh, kuasa, gerogot, ragu, tawan, dll.).
        - **Stress** dicirikan kata *tenggat*, *rentet*, *wajib*; **Personality Disorder** oleh *monster*, *ilusi*, *fluktuasi*, *minder*.
        - **Depression** dan **Suicidal** memiliki hanya 6 token eksklusif masing-masing — paling sulit dibedakan karena tumpang tindih semantik tertinggi antar kondisi.
        """)

    with st.expander("❓ Pertanyaan 2: Performa Model Klasifikasi NLP", expanded=True):
        st.markdown("""
        **Pertanyaan:** Bisakah model NLP mencapai akurasi ≥ 80% dan F1 ≥ 0,75 dalam mengklasifikasikan 7 kondisi mental?

        **Jawaban: YA ✅**
        - Model terbaik: **Word2Vec + LinearSVC** — Akurasi **82.9%**, F1 Macro **0.851**
        - Semua 4 kombinasi model melewati target akurasi 80%.
        - **Catatan:** Depression (F1 0.636) dan Suicidal (F1 0.661) di bawah target 0.75 — saling tertukar 881 kali. Normal (F1 0.765) juga sering tertukar dengan keduanya (195 kasus).
        """)

    st.markdown('<div class="section-header">Rekomendasi Pengembangan</div>', unsafe_allow_html=True)

    rec_col1, rec_col2 = st.columns(2)
    with rec_col1:
        st.markdown("""
        <div class="insight-box"><b>1. Tangani Class Imbalance</b><br>Gunakan SMOTE atau augmentasi data khususnya untuk kelas <i>depression</i> dan <i>suicidal</i> yang memiliki F1 rendah dan sering tertukar satu sama lain.</div>
        <div class="insight-box"><b>2. Eksperimen Model Lanjutan</b><br>Coba model transformer seperti IndoBERT atau mBERT yang dioptimasi untuk Bahasa Indonesia.</div>
        <div class="insight-box"><b>3. Perluas Dataset</b><br>Tambah data untuk kelas minoritas (<i>personality disorder</i> = 730, <i>stress</i> = 1.046) untuk menyeimbangkan distribusi kelas.</div>
        """, unsafe_allow_html=True)
    with rec_col2:
        st.markdown("""
        <div class="insight-box"><b>4. Feature Engineering Lanjutan</b><br>Tambahkan fitur linguistik seperti analisis sentimen, deteksi emosi, intensitas negatif, dan fitur pragmatik.</div>
        <div class="insight-box"><b>5. Tangani Tumpang Tindih Kelas</b><br>Kembangkan strategi khusus untuk membedakan pasangan kondisi yang paling sering tertukar: <i>depression ↔ suicidal</i> (881 kasus total), dan <i>normal ↔ depression/suicidal</i> (195 kasus total).</div>
        <div class="insight-box"><b>6. Validasi Klinis</b><br>Sebelum deployment, validasi model dengan psikolog atau profesional kesehatan mental untuk memastikan keamanan dan akurasi klinis.</div>
        """, unsafe_allow_html=True)

    st.markdown('<div class="section-header">Ringkasan Pencapaian</div>', unsafe_allow_html=True)
    achievements = {
        "Akurasi ≥ 80% tercapai":                              True,
        "F1 Macro ≥ 0.75 tercapai":                            True,
        "Word2Vec unggul pada model terbaik (LinearSVC)":      True,
        "Word2Vec unggul pada A/B Testing (LR) — signifikan":  True,
        "Semua kelas F1 ≥ 0.75":                               False,
        "Depression & Suicidal perlu perbaikan":               True,
    }
    for achievement, status in achievements.items():
        icon   = "✅" if status else "⚠️"
        color  = "#10B981" if status else "#F59E0B"
        bg     = "rgba(16,185,129,0.08)" if status else "rgba(245,158,11,0.08)"
        border = "rgba(16,185,129,0.25)" if status else "rgba(245,158,11,0.25)"

        st.markdown(
            f'<div style="background:{bg}; border:1px solid {border}; border-left:3px solid {color}; '
            f'border-radius:10px; padding:0.7rem 1.2rem; margin:6px 0; color:var(--text-secondary); '
            f'font-size:0.9rem; font-weight:500;">{icon} {achievement}</div>',
            unsafe_allow_html=True
        )

# ─── Footer ───────────────────────────────────────────────────────────────────
st.divider()
st.markdown(
    "<div style='text-align:center; color:var(--muted); font-size:0.78rem; padding:0.6rem 0; letter-spacing:0.05em;'>"
    "🧠 <span style='color:var(--text-secondary); font-weight:600;'>CORTISOUL</span>"
    " &nbsp;·&nbsp; Capstone Project &nbsp;·&nbsp; NLP untuk Kesehatan Mental &nbsp;·&nbsp; Bahasa Indonesia"
    "</div>",
    unsafe_allow_html=True
)