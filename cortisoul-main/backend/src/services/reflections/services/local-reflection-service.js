const LABEL_OPENERS = {
  anxiety:
    'Rasa cemas yang kamu tuliskan terdengar melelahkan, tetapi keberanianmu menuliskannya adalah tanda bahwa kamu masih berusaha menjaga diri.',
  bipolar:
    'Perubahan rasa yang kamu alami mungkin terasa membingungkan, dan fakta bahwa kamu berhenti sejenak untuk menulis ini adalah langkah yang berarti.',
  depression:
    'Apa yang kamu rasakan terdengar berat, dan tetap menuliskannya menunjukkan ada bagian dari dirimu yang masih ingin dipahami dan ditolong.',
  normal:
    'Tulisanmu menunjukkan kamu sedang mencoba hadir dengan jujur pada keadaan hari ini, dan itu hal yang patut dihargai.',
  personality_disorder:
    'Dinamika yang kamu ceritakan mungkin tidak mudah dijalani, tetapi kesadaranmu untuk melihatnya adalah awal yang kuat.',
  stress:
    'Tekanan yang kamu rasakan terdengar nyata, dan menuliskannya adalah cara baik untuk mulai mengurai beban itu.',
  suicidal:
    'Rasa sakit yang kamu tuliskan sangat serius, dan kamu tidak perlu menghadapinya sendirian. Jika kamu merasa tidak aman, segera hubungi orang terdekat atau layanan darurat setempat.',
};

const ACTIONS = {
  anxiety:
    'Untuk hari ini, coba tarik napas perlahan, tulis satu kekhawatiran yang paling mendesak, lalu pilih satu langkah kecil yang bisa kamu kendalikan.',
  bipolar:
    'Untuk hari ini, coba jaga ritme sederhana: makan, minum, istirahat, dan hindari keputusan besar saat emosi sedang sangat naik atau turun.',
  depression:
    'Untuk hari ini, cukup mulai dari hal kecil: minum air, mandi, membuka jendela, atau mengirim pesan singkat ke orang yang kamu percaya.',
  normal:
    'Untuk menjaga ritme baik ini, pilih satu hal kecil yang membuatmu merasa stabil dan beri ruang untuk menikmatinya tanpa terburu-buru.',
  personality_disorder:
    'Untuk hari ini, coba beri jeda sebelum merespons sesuatu yang memicu emosi, lalu tuliskan apa yang sebenarnya kamu butuhkan.',
  stress:
    'Untuk hari ini, pilih satu beban yang bisa ditunda, satu yang bisa dibagi, dan satu hal kecil yang bisa kamu selesaikan perlahan.',
  suicidal:
    'Saat ini yang paling penting adalah keselamatanmu. Dekati orang yang kamu percaya, jangan sendirian, dan cari bantuan profesional atau layanan darurat jika dorongan itu terasa kuat.',
};

const shouldUseCrisisCopy = (label) => label === 'suicidal';

export const localReflectionService = ({
  content,
  emotion = 'normal',
  stressScore = 2.2,
  stressCategory = 'Baik',
}) => {
  const label = LABEL_OPENERS[emotion] ? emotion : 'normal';
  const scoreText = `${stressScore}/10 (${stressCategory})`;
  const middleParagraph = shouldUseCrisisCopy(label)
    ? `Tulisanmu menunjukkan kamu sedang berada di titik yang sangat berat. Skor stresmu berada di ${scoreText}, jadi prioritas saat ini adalah membuatmu tetap aman dan tidak sendirian.`
    : `Tulisanmu menunjukkan kamu sedang mencoba memahami diri sendiri dengan lebih jujur. Skor stresmu berada di ${scoreText}, jadi wajar kalau tubuh dan pikiranmu meminta ruang untuk bernapas.`;

  const closing = shouldUseCrisisCopy(label)
    ? 'Kamu berharga, dan keselamatanmu lebih penting daripada menyelesaikan semuanya sendirian malam ini.'
    : 'Pelan-pelan saja; satu langkah kecil tetap berarti, dan kamu tidak harus menyelesaikan semuanya hari ini.';

  const teks = `${LABEL_OPENERS[label]} Kamu sudah melakukan sesuatu yang penting: memberi nama pada isi pikiranmu, bukan membiarkannya menumpuk sendirian.

${middleParagraph}

${ACTIONS[label]} ${closing}`;

  return {
    teks,
    model: 'local-reflection-fallback',
    ada_pesan_krisis: label === 'suicidal',
    source: 'local-fallback',
  };
};
