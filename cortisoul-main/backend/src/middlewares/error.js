import response from '../utils/response.js';
import { ClientError } from '../exceptions/index.js';
import logger from '../config/logger.js';

const normalizeMessage = (message) => {
  if (message == null) return '';
  if (typeof message === 'string') return message;
  if (message instanceof Error) return message.message;

  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
};

// eslint-disable-next-line
const ErrorHandler = (err, req, res, next) => {
  if (err instanceof ClientError) {
    return response(res, err.statusCode, normalizeMessage(err.message), null);
  }

  if (err.isJoi) {
    return response(res, 400, normalizeMessage(err.details[0].message), null);
  }

  const status = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : normalizeMessage(err.message || err);

  logger.error('Unhandled error: %o', err);

  return response(res, status, message, null);
};

export default ErrorHandler;
