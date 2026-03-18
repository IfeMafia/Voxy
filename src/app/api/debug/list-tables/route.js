import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Check existing tables
    const tableRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    return NextResponse.json({ 
      success: true, 
      tables: tableRes.rows.map(r => r.table_name) 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
