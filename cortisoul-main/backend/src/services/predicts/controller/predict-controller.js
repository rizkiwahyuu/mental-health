import response from '../../../utils/response.js';
import { predictService } from '../services/predict-services.js';

export const predictText = async (req, res, next) => {
  const { text } = req.validated;

  try {
    const result = await predictService(text);
    return response(res, 200, 'Prediksi model Prediksi berhasil', {
      prediction: result,
    });
  } catch (error) {
    return next(error);
  }
};
