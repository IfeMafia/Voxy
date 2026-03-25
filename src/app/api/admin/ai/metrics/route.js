import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAdmin, adminError } from '@/lib/adminAuth';

/**
 * GET /api/admin/ai/metrics
 * Summary of overall AI usage and system health.
 */
export async function GET() {
  const auth = await isAdmin();
  if (!auth.authorized) return adminError(auth.error, auth.status);

  try {
    // Optimized single scan query for summary metrics
    const res = await db.query(`
      SELECT 
        COUNT(*)::int as "totalRequests",
        ROUND(COALESCE(SUM(estimated_cost), 0), 4) as "totalCost",
        ROUND(COALESCE(AVG(latency), 0), 2) as "avgLatency"
      FROM ai_usage_logs
    `);

    return NextResponse.json({ 
      success: true, 
      metrics: res.rows[0] 
    });
  } catch (error) {
    console.error('AI Metrics API Error:', error);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}
