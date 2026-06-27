import { nanoid } from 'nanoid';
import pool from '../../../config/database.js';

class ReflectionRepositories {
  constructor() {
    this._pool = pool;
  }

  async addReflection({ journalId, text }) {
    const id = `reflect-${nanoid(16)}`;
    const createdAt = new Date().toISOString();

    const query = {
      text: `INSERT INTO reflections(id, journal_id, text, created_at)
              VALUES($1, $2, $3, $4)
              RETURNING id, journal_id, text AS reflection_text, text AS teks_refleksi, created_at`,
      values: [id, journalId, text, createdAt],
    };

    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async getReflectionByJournalId(journalId) {
    const query = {
      text: `SELECT id, journal_id, text AS reflection_text, text AS teks_refleksi, created_at
             FROM reflections WHERE journal_id = $1`,
      values: [journalId],
    };

    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async updateReflectionByJournalId({ journalId, text }) {
    const query = {
      text: `UPDATE reflections
             SET text = $1
             WHERE journal_id = $2
             RETURNING id, journal_id, text AS reflection_text, text AS teks_refleksi, created_at`,
      values: [text, journalId],
    };

    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async deleteReflectionByJournalId(journalId) {
    const query = {
      text: 'DELETE FROM reflections WHERE journal_id = $1 RETURNING id',
      values: [journalId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

export default new ReflectionRepositories();
