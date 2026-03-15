import { Pool } from 'pg';

// Create a new pool instance using the database URL from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For production usually you'd want ssl: { rejectUnauthorized: false } if using hosted services
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Execute a database query
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 */
export const query = (text, params) => pool.query(text, params);

export default pool;
