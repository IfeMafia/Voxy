const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const sql = `
    -- Audit Logs Table
    CREATE TABLE IF NOT EXISTS public.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID, -- References auth.users(id) if available, or just log name
        admin_email TEXT,
        action TEXT NOT NULL,
        entity_type TEXT, -- 'business', 'system', 'alert', etc.
        entity_id TEXT,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
  `;

  try {
    console.log('Running audit log migration...');
    await pool.query(sql);
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
