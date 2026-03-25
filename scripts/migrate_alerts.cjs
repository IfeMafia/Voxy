const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const sql = `
    -- Alerts Table
    CREATE TABLE IF NOT EXISTS public.alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL CHECK (type IN ('credit_low', 'anomaly', 'system_error')),
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        message TEXT NOT NULL,
        business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE
    );

    -- Business Table Extensions
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_ai_enabled BOOLEAN DEFAULT TRUE;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS rate_limit_per_min INTEGER DEFAULT 60;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS forced_model TEXT;

    -- Create index for alerts
    CREATE INDEX IF NOT EXISTS idx_alerts_business_id ON public.alerts(business_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at);
  `;

  try {
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
