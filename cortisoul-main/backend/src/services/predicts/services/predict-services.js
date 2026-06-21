import axios from 'axios';
import logger from '../../../config/logger.js';

const predictServiceBaseUrl = process.env.PREDICT_SERVICE_URL;

if (!predictServiceBaseUrl) {
  throw new Error('PREDICT_SERVICE_URL environment variable is not configured');
}

export const predictService = async (text) => {
  try {
    const response = await axios.post(`${predictServiceBaseUrl}/predict`, {
      text,
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
