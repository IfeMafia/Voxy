import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAdmin, adminError } from '@/lib/adminAuth';

/**
 * GET /api/admin/ai/usage
 * Returns daily request counts for usage trending.
 */
export async function GET() {
  const auth = await isAdmin();
  if (!auth.authorized) return adminError(auth.error, auth.status);

  try {
    // Group requests by day, limited to last 30 active days
    const res = await db.query(`
      SELECT 
        DATE_TRUNC('day', created_at)::date as "date",
        COUNT(*)::int as "count"
      FROM ai_usage_logs
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 30
    `);

    return NextResponse.json({ 
      success: true, 
      usage: res.rows 
    });
  } catch (error) {
    console.error('AI Usage API Error:', error);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}
