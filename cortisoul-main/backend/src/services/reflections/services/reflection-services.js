import axios from 'axios';
import logger from '../../../config/logger.js';
import { localReflectionService } from './local-reflection-service.js';

const reflectionServiceBaseUrl = process.env.REFLECTION_SERVICE_URL;
const fallbackEnabled = process.env.REFLECTION_FALLBACK_ENABLED !== 'false';

const getFallbackReflection = (payload, reason) => {
  if (!fallbackEnabled) return null;

  logger.warn(`Using local reflection fallback: ${reason}`);
  return localReflectionService(payload);
};

export const reflectionService = async ({
  content,
  emotion,
  stressScore,
  stressCategory,
}) => {
  const payload = { content, emotion, stressScore, stressCategory };

  if (!reflectionServiceBaseUrl) {
    return getFallbackReflection(
      payload,
      'REFLECTION_SERVICE_URL environment variable is not configured'
    );
  }

  try {
    const response = await axios.post(`${reflectionServiceBaseUrl}/reflect`, {
      /* eslint-disable */
      text: content,
      prediksi_label: emotion,
      stress_score: stressScore,
      kategori_stres: stressCategory,
      /* eslint-enable */
    }, { timeout: 30000 });

    return response.data;
  } catch (error) {
    const { response } = error;
    const reason =
      error.message || error.code || 'Reflection service tidak tersedia';

    if (response && response.status === 502) {
      const detailedInfo =
        typeof response.data === 'object'
          ? JSON.stringify(response.data)
          : response.data;
      logger.error(`502 Bad Gateway: ${detailedInfo}`, { cause: error });
    }

    logger.error(reason, { cause: error });
    return getFallbackReflection(payload, reason);
  }
};
