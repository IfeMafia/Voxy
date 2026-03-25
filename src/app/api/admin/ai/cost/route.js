import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAdmin, adminError } from '@/lib/adminAuth';

/**
 * GET /api/admin/ai/cost
 * Returns financial metrics for AI operations.
 */
export async function GET() {
  const auth = await isAdmin();
  if (!auth.authorized) return adminError(auth.error, auth.status);

  try {
    // 1. Daily Cost Trending
    const dailyCostRes = await db.query(`
      SELECT 
        DATE_TRUNC('day', created_at)::date as "date",
        ROUND(SUM(estimated_cost), 6) as "cost"
      FROM ai_usage_logs
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 30
    `);

    // 2. Cost Analysis by Request Type (Chat, Voice, System)
    const typeCostRes = await db.query(`
      SELECT 
        request_type as "type",
        ROUND(SUM(estimated_cost), 6) as "cost"
      FROM ai_usage_logs
      GROUP BY 1
      ORDER BY 2 DESC
    `);

    return NextResponse.json({ 
      success: true, 
      dailyCost: dailyCostRes.rows,
      typeCost: typeCostRes.rows 
    });
  } catch (error) {
    console.error('AI Cost API Error:', error);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}
