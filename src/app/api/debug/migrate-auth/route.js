import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 1. Drop existing auth_tokens just in case it's in a weird state
    // but not really necessary if it doesn't exist.
    
    // 2. Create the Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        type TEXT NOT NULL, 
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        attempts INTEGER DEFAULT 0,
        last_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create Index
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_type ON auth_tokens(user_id, type)
    `);

    // 4. Update users table columns (for is_verified etc.)
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url TEXT`);

    return NextResponse.json({ 
      success: true, 
      message: 'Auth Tokens table and User schema updated successfully' 
    });
  } catch (error) {
    console.error('Migration Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
