import { nanoid } from 'nanoid';
import pool from '../../../config/database.js';

class NotificationRepositories {
  constructor() {
    this._pool = pool;
  }

  async addSubscription({ userId, endpoint, keysP256dh, keysAuth }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: `INSERT INTO notifications(id, user_id, endpoint, keys_p256dh, keys_auth, created_at, updated_at)
              VALUES($1, $2, $3, $4, $5, $6, $7)
              RETURNING id`,
      values: [
        id,
        userId,
        endpoint,
        keysP256dh,
        keysAuth,
        createdAt,
        updatedAt,
      ],
    };

    const result = await this._pool.query(query);
    return result.rows[0].id;
  }

  async removeSubscription(endpoint) {
    const query = {
      text: 'DELETE FROM notifications WHERE endpoint = $1 RETURNING id',
      values: [endpoint],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      return null;
    }
    return result.rows[0].id;
  }

  async getSubscriptionsByUserId(userId) {
    const query = {
      text: 'SELECT * FROM notifications WHERE user_id = $1',
      values: [userId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getAllSubscriptions() {
    const query = {
      text: 'SELECT * FROM notifications',
    };
    const result = await this._pool.query(query);
    return result.rows;
  }
}

export default new NotificationRepositories();
