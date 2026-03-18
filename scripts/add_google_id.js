import { config } from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function run() {
  console.log('Adding google_id column to users table...');
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT');
    console.log('Done.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
