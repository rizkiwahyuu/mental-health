import { nanoid } from 'nanoid';
import pool from '../../../config/database.js';
import CacheService from '../../../cache/redis-config.js';
import { getWeekRange, formatToYmd } from '../../../utils/date.js';

class JournalRepositories {
  constructor() {
    this._pool = pool;
    this.cacheService = new CacheService();
  }

  async createJournal({
    title,
    content,
    owner,
    stressScore = null,
    emotion = null,
    stressCategory = null,
  }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: `INSERT INTO journals(id, title, content, created_at, updated_at, stress_score, emotion, owner, stress_category)
              VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING id`,
      values: [
        id,
        title,
        content,
        createdAt,
        updatedAt,
        stressScore,
        emotion,
        owner,
        stressCategory,
      ],
    };

    const result = await this._pool.query(query);
    await this._deleteCache(owner);
    return result.rows[0].id;
  }

  async getJournals(owner) {
    const cacheKey = `journals:${owner}`;

    try {
      const journals = await this.cacheService.get(cacheKey);
      return { data: JSON.parse(journals), source: 'cache' };
    } catch {
      const query = {
        text: 'SELECT * FROM journals WHERE owner = $1',
        values: [owner],
      };

      const result = await this._pool.query(query);
      await this.cacheService.set(cacheKey, JSON.stringify(result.rows));
      return { data: result.rows, source: 'database' };
    }
  }

  async getJournalById(id) {
    const query = {
      text: 'SELECT * FROM journals WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async editJournalById({
    id,
    title,
    content,
    stressScore = null,
    emotion = null,
    stressCategory = null,
  }) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: `UPDATE journals
             SET title = $1,
                 content = $2,
                 updated_at = $3,
                 stress_score = $4,
                 emotion = $5,
                 stress_category = $6
             WHERE id = $7
             RETURNING *`,
      values: [title, content, updatedAt, stressScore, emotion, stressCategory, id],
    };

    const result = await this._pool.query(query);

    if (result.rows[0]) {
      await this._deleteCache(result.rows[0].owner);
    }

    return result.rows[0];
  }

  async deleteJournalById(id) {
    const query = {
      text: 'DELETE FROM journals WHERE id = $1 RETURNING id, owner',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows[0]) {
      await this._deleteCache(result.rows[0].owner);
    }

    return result.rows[0];
  }

  async verifyJournalOwner(id, owner) {
    const query = {
      text: `
        SELECT 1 FROM journals
        WHERE id = $1 AND owner = $2
      `,
      values: [id, owner],
    };

    const result = await this._pool.query(query);

    return result.rowCount > 0;
  }

  async getWeeklyStressLevels(owner, startDate, endDate) {
    const cacheKey = `stressLevels:${owner}:${startDate}:${endDate}`;

    try {
      const weeklyStressLevels = await this.cacheService.get(cacheKey);
      return { data: JSON.parse(weeklyStressLevels), source: 'cache' };
    } catch {
      const query = {
        text: `
          SELECT
            DATE(created_at) AS date,
            ROUND(AVG(stress_score), 1) AS average_score
          FROM journals
          WHERE owner = $1
            AND created_at >= $2
            AND created_at <= $3
            AND stress_score IS NOT NULL
          GROUP BY DATE(created_at)
          ORDER BY DATE(created_at) ASC
        `,
        values: [owner, startDate, endDate],
      };

      const result = await this._pool.query(query);
      await this.cacheService.set(cacheKey, JSON.stringify(result.rows));
      return { data: result.rows, source: 'database' };
    }
  }

  async getWeeklyEmotionSummary(owner, startDate, endDate) {
    const cacheKey = `emotionSummary:${owner}:${startDate}:${endDate}`;

    try {
      const weeklyEmotionSummary = await this.cacheService.get(cacheKey);
      return { data: JSON.parse(weeklyEmotionSummary), source: 'cache' };
    } catch {
      const query = {
        text: `
          SELECT
            emotion AS label,
            COUNT(*)::int AS count
          FROM journals
        WHERE owner = $1
          AND created_at >= $2
          AND created_at <= $3
          AND emotion IS NOT NULL
        GROUP BY emotion
        ORDER BY count DESC
      `,
        values: [owner, startDate, endDate],
      };

      const result = await this._pool.query(query);
      await this.cacheService.set(cacheKey, JSON.stringify(result.rows));
      return { data: result.rows, source: 'database' };
    }
  }

  async _deleteCache(owner) {
    const { start, end } = getWeekRange();
    const startDate = formatToYmd(start);
    const endDate = formatToYmd(end);

    await this.cacheService.delete(`journals:${owner}`);
    await this.cacheService.delete(
      `stressLevels:${owner}:${startDate}:${endDate}`
    );
    await this.cacheService.delete(
      `emotionSummary:${owner}:${startDate}:${endDate}`
    );
  }
}

export default new JournalRepositories();
