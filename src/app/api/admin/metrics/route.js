import { NextResponse } from 'next/server';
import { isAdmin, adminError } from '@/lib/adminAuth';
import db from '@/lib/db';

export async function GET() {
  try {
    const authStatus = await isAdmin();
    if (!authStatus.authorized) {
      return adminError(authStatus.error, authStatus.status);
    }

    // 1. Get total users
    const usersCount = (await db.query('SELECT count(*) FROM users')).rows[0].count;
    
    // 2. Get active businesses
    const businessesCount = (await db.query('SELECT count(*) FROM businesses WHERE is_live = true')).rows[0].count;
    
    // 3. Get total conversations
    const conversationsCount = (await db.query('SELECT count(*) FROM conversations')).rows[0].count;

    // 4. Get total messages
    const messagesCount = (await db.query('SELECT count(*) FROM messages')).rows[0].count;

    // 5. Get recent user registrations (last 7 days)
    const recentUsers = (await db.query(`
      SELECT count(*) 
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '7 days';
    `)).rows[0].count;

    // 6. Get registration data for Chart (last 30 days)
    const chartDataResult = await db.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date, 
        count(*) as count 
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY date 
      ORDER BY date ASC
    `);

    const chartData = chartDataResult.rows.map(row => ({
      name: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      registrations: parseInt(row.count)
    }));

    return NextResponse.json({
      success: true,
      metrics: {
        total_users: parseInt(usersCount),
        active_businesses: parseInt(businessesCount),
        total_conversations: parseInt(conversationsCount),
        total_messages: parseInt(messagesCount),
        recent_users_7d: parseInt(recentUsers),
      },
      chartData
    });

  } catch (error) {
    console.error('Admin Metrics Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
