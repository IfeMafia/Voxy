import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const sqlPath = path.join(__dirname, '../sql/add_contact_info.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log("🏃 Running migration...");
    await pool.query(sql);
    console.log("✅ Migration successful: Added phone and address columns.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await pool.end();
  }
}

run();
