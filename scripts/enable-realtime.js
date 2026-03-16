const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Use SSL for Supabase/Neon
});

async function enableRealtime() {
  try {
    console.log('Enabling Realtime for messages and conversations...');
    
    // 1. Ensure publication exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
          CREATE PUBLICATION supabase_realtime;
        END IF;
      END $$;
    `);
    console.log('Verified supabase_realtime publication exists.');

    // 2. Add tables to publication (ignore error if already added)
    try {
      await pool.query('ALTER PUBLICATION supabase_realtime ADD TABLE messages');
      console.log('Added messages to supabase_realtime');
    } catch (e) {
      if (e.code === '42710') {
        console.log('Messages table already in publication');
      } else {
        console.error('Error adding messages table:', e.message);
      }
    }

    try {
      await pool.query('ALTER PUBLICATION supabase_realtime ADD TABLE conversations');
      console.log('Added conversations to supabase_realtime');
    } catch (e) {
      if (e.code === '42710') {
        console.log('Conversations table already in publication');
      } else {
        console.error('Error adding conversations table:', e.message);
      }
    }

    console.log('Realtime enabled successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error enabling realtime:', err);
    process.exit(1);
  }
}

enableRealtime();
