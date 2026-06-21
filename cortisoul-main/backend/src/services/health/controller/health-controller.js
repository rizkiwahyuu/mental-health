import response from '../../../utils/response.js';

export const healthCheck = (req, res) => {
  return response(res, 200, 'Service is healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};
