import axios from 'axios';
import logger from '../../../config/logger.js';

const reflectionServiceBaseUrl = process.env.REFLECTION_SERVICE_URL;

if (!reflectionServiceBaseUrl) {
  throw new Error(
    'REFLECTION_SERVICE_URL environment variable is not configured'
  );
}

export const reflectionService = async ({
  content,
  emotion,
  stressScore,
  stressCategory,
}) => {
  try {
    const response = await axios.post(`${reflectionServiceBaseUrl}/reflect`, {
      /* eslint-disable */
      text: content,
      prediksi_label: emotion,
      stress_score: stressScore,
      kategori_stres: stressCategory,
      /* eslint-enable */
    });

    return response.data;
  } catch (error) {
    const { response } = error;

    if (response && response.status === 502) {
      const detailedInfo =
        typeof response.data === 'object'
          ? JSON.stringify(response.data)
          : response.data;
      logger.error(`502 Bad Gateway: ${detailedInfo}`, { cause: error });
    }

    logger.error(error.message, { cause: error });
  }
};
