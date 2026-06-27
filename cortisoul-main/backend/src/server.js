import server from './server/index.js';
import logger from './config/logger.js';

const port = process.env.PORT || 5000;
const host = process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0';

server.listen(port, () => {
  logger.info(`Server is running on http://${host}:${port}`);
});
