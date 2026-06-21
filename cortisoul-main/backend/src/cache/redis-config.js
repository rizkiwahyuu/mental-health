import { createClient } from 'redis';
import logger from '../config/logger.js';

class CacheService {
  constructor() {
    this._client = createClient({
      url: process.env.REDIS_URL,
    });

    this._client.on('error', (error) => {
      logger.error('Redis error: %o', error);
    });

    this._client.connect();
  }

  async set(key, value, expirationInSecond = 3600) {
    await this._client.set(key, value, {
      EX: expirationInSecond,
    });
  }

  async get(key) {
    const result = await this._client.get(key);
    if (result === null) throw new Error('Cache tidak ditemukan');
    return result;
  }

  async delete(key) {
    return await this._client.del(key);
  }
}

export default CacheService;
