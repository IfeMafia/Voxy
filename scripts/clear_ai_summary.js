import { config } from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function clearSummary() {
  console.log('Clearing ai_summary from businesses table...');
  try {
    const res = await pool.query('UPDATE businesses SET ai_summary = NULL');
    console.log(`Successfully cleared ai_summary for ${res.rowCount} businesses.`);
    // also clear conversation summaries so the context refreshes immediately
    const res2 = await pool.query('UPDATE conversations SET summary = NULL');
    console.log(`Successfully cleared conversation summaries for ${res2.rowCount} conversations.`);
  } catch (err) {
    console.error('Error clearing summaries:', err);
  } finally {
    pool.end();
  }
}

clearSummary();
