const LABELS = [
  'anxiety',
  'bipolar',
  'depression',
  'normal',
  'personality_disorder',
  'stress',
  'suicidal',
];

const KEYWORDS = {
  suicidal: [
    'bunuh diri',
    'mengakhiri hidup',
    'mati saja',
    'ingin mati',
    'tidak mau hidup',
  ],
  depression: [
    'hampa',
    'sedih',
    'putus asa',
    'menangis',
    'tidak bersemangat',
    'lelah hidup',
    'kosong',
  ],
  anxiety: [
    'cemas',
    'khawatir',
    'panik',
    'takut',
    'gelisah',
    'overthinking',
  ],
  stress: [
    'stres',
    'stress',
    'tertekan',
    'beban',
    'capek',
    'kewalahan',
    'pusing',
  ],
  bipolar: [
    'mood berubah',
    'naik turun',
    'sangat berenergi',
    'sangat bahagia',
    'sangat sedih',
  ],
  personality_disorder: [
    'hubungan',
    'ditinggalkan',
    'emosi meledak',
    'tidak stabil',
    'percaya orang',
  ],
};

const LABEL_PRIORITY = {
  suicidal: 7,
  depression: 6,
  stress: 5,
  anxiety: 4,
  bipolar: 3,
  personality_disorder: 2,
  normal: 1,
};

const STRESS_BY_LABEL = {
  normal: 2.2,
  anxiety: 5.8,
  bipolar: 6.2,
  depression: 6.8,
  personality_disorder: 6.4,
  stress: 7.1,
  suicidal: 9.2,
};

const scoreToKategori = (score) => {
  if (score <= 2.5) return 'Baik';
  if (score <= 4.5) return 'Ringan';
  if (score <= 6.5) return 'Sedang';
  if (score <= 8.5) return 'Berat';
  return 'Kritis';
};

const normalize = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();

const detectLabel = (text) => {
  const cleanText = normalize(text);
  const scores = Object.entries(KEYWORDS).map(([label, keywords]) => {
    const score = keywords.reduce(
      (count, keyword) => count + (cleanText.includes(keyword) ? 1 : 0),
      0
    );
    return { label, score, priority: LABEL_PRIORITY[label] };
  });

  scores.sort((a, b) => b.score - a.score || b.priority - a.priority);
  return scores[0].score > 0 ? scores[0].label : 'normal';
};

const buildProbabilities = (selectedLabel) => {
  const base = Object.fromEntries(LABELS.map((label) => [label, 0.04]));
  base[selectedLabel] = 0.76;

  const remainder = 1 - Object.values(base).reduce((sum, value) => sum + value, 0);
  base.stress += remainder;

  return Object.fromEntries(
    Object.entries(base).map(([label, value]) => [
      label,
      `${(Math.max(value, 0) * 100).toFixed(2)}%`,
    ])
  );
};

export const localPredictService = (text) => {
  const prediksiLabel = detectLabel(text);
  const stressScore = STRESS_BY_LABEL[prediksiLabel];

  return {
    input_text: text,
    cleaned_text: normalize(text),
    prediksi_label: prediksiLabel,
    confidence: '76.00%',
    stress_score: stressScore,
    kategori_stres: scoreToKategori(stressScore),
    detail_probabilitas: buildProbabilities(prediksiLabel),
    source: 'local-fallback',
  };
};
