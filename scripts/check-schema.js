import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAllSchema() {
  try {
    const tables = ['businesses', 'conversations', 'messages', 'users', 'customers'];
    for (const table of tables) {
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY column_name
      `, [table]);
      console.log(`\n--- Table: ${table} ---`);
      if (res.rows.length === 0) {
        console.log('No columns found (table might not exist).');
      } else {
        res.rows.forEach(row => console.log(`${row.column_name.padEnd(25)} | ${row.data_type}`));
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error checking schema:', err);
    process.exit(1);
  }
}

checkAllSchema();
