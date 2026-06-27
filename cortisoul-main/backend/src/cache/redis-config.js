import { createClient } from 'redis';
import logger from '../config/logger.js';

class CacheService {
  constructor() {
    this._isReady = false;
    this._isEnabled = process.env.CACHE_ENABLED !== 'false';

    if (!this._isEnabled || !process.env.REDIS_URL) {
      logger.warn('Redis cache dinonaktifkan, cache dilewati');
      return;
    }

    this._client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: false,
      },
    });

    this._client.on('error', (error) => {
      this._isReady = false;
      logger.warn('Redis tidak tersedia, cache dilewati: %s', error.message);
    });

    this._client.on('ready', () => {
      this._isReady = true;
    });

    this._client.connect().catch((error) => {
      this._isReady = false;
      logger.warn('Gagal terhubung ke Redis, cache dilewati: %s', error.message);
    });
  }

  async set(key, value, expirationInSecond = 3600) {
    if (!this._isEnabled || !this._isReady) return null;

    await this._client.set(key, value, {
      EX: expirationInSecond,
    });
  }

  async get(key) {
    if (!this._isEnabled || !this._isReady) {
      throw new Error('Cache tidak tersedia');
    }

    const result = await this._client.get(key);
    if (result === null) throw new Error('Cache tidak ditemukan');
    return result;
  }

  async delete(key) {
    if (!this._isEnabled || !this._isReady) return 0;

    return await this._client.del(key);
  }
}

export default CacheService;
