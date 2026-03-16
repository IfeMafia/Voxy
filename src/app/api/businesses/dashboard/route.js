import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('range') || '7d';

    // 1. Get user's business
    const bizResult = await db.query('SELECT * FROM businesses WHERE owner_id = $1', [user.id]);
    const business = bizResult.rows[0];

    if (!business) {
      return NextResponse.json({ success: true, business: null });
    }

    const bizId = business.id;

    // 2. Fetch Stats
    const totalRes = await db.query('SELECT COUNT(*) FROM conversations WHERE business_id = $1', [bizId]);
    const aiRes = await db.query("SELECT COUNT(*) FROM conversations WHERE business_id = $1 AND status = 'AI Resolved'", [bizId]);
    const ownerIntRes = await db.query("SELECT COUNT(*) FROM conversations WHERE business_id = $1 AND status = 'Needs Owner Response'", [bizId]);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const activeRes = await db.query("SELECT COUNT(*) FROM conversations WHERE business_id = $1 AND created_at >= $2", [bizId, today.toISOString()]);

    const stats = {
      total: parseInt(totalRes.rows[0].count) || 0,
      activeToday: parseInt(activeRes.rows[0].count) || 0,
      aiResolved: parseInt(aiRes.rows[0].count) || 0,
      ownerInterventions: parseInt(ownerIntRes.rows[0].count) || 0
    };

    // 3. Fetch Recent Conversations
    const recentRes = await db.query(
      'SELECT * FROM conversations WHERE business_id = $1 ORDER BY created_at DESC LIMIT 10',
      [bizId]
    );

    const conversations = recentRes.rows;

    // 4. Fetch Chart Data
    let days = 7;
    if (timeRange === '24h') days = 1;
    if (timeRange === '30d') days = 30;

    const chartData = [];

    if (timeRange === '24h') {
      for (let i = 23; i >= 0; i--) {
        const start = new Date();
        start.setHours(start.getHours() - i, 0, 0, 0);
        const end = new Date(start);
        end.setHours(end.getHours() + 1);

        const countRes = await db.query(
          'SELECT COUNT(*) FROM conversations WHERE business_id = $1 AND created_at >= $2 AND created_at < $3',
          [bizId, start.toISOString(), end.toISOString()]
        );

        chartData.push({
          name: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: parseInt(countRes.rows[0].count) || 0
        });
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const start = new Date();
        start.setDate(start.getDate() - i);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const countRes = await db.query(
          'SELECT COUNT(*) FROM conversations WHERE business_id = $1 AND created_at >= $2 AND created_at < $3',
          [bizId, start.toISOString(), end.toISOString()]
        );

        chartData.push({
          name: start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
          count: parseInt(countRes.rows[0].count) || 0
        });
      }
    }

    return NextResponse.json({
      success: true,
      business,
      stats,
      conversations,
      chartData
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
