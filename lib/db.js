import { Pool } from 'pg';

// Supabase Postgres Connection using 'pg'
// Ensure you have DATABASE_URL in your .env.local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Executes a database query using the Postgres Pool
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database Query Error:', error.message);
    throw error;
  }
}

/**
 * Helper to get a client from the pool for transactions
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

// Default export for convenience
export default {
  query,
  getClient,
};
