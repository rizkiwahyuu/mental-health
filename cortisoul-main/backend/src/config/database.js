import pg from 'pg';
import logger from './logger.js';
const { Pool } = pg;

// database configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client: %o', err);
});

export default pool;
