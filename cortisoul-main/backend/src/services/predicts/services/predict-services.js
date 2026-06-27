import axios from 'axios';
import logger from '../../../config/logger.js';
import { localPredictService } from './local-predict-service.js';

const predictServiceBaseUrl = process.env.PREDICT_SERVICE_URL;
const fallbackEnabled = process.env.PREDICT_FALLBACK_ENABLED !== 'false';

const getFallbackPrediction = (text, reason) => {
  if (!fallbackEnabled) return null;

  logger.warn(`Using local prediction fallback: ${reason}`);
  return localPredictService(text);
};

export const predictService = async (text) => {
  if (!predictServiceBaseUrl) {
    return getFallbackPrediction(
      text,
      'PREDICT_SERVICE_URL environment variable is not configured'
    );
  }

  try {
    const response = await axios.post(`${predictServiceBaseUrl}/predict`, {
      text,
    }, { timeout: 30000 });

    return response.data;
  } catch (error) {
    const { response } = error;
    const reason =
      error.message || error.code || 'Prediction service tidak tersedia';

    if (response && response.status === 502) {
      const detailedInfo =
        typeof response.data === 'object'
          ? JSON.stringify(response.data)
          : response.data;
      logger.error(`502 Bad Gateway: ${detailedInfo}`, { cause: error });
    }

    logger.error(reason, { cause: error });
    return getFallbackPrediction(text, reason);
  }
};
