import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get user's business
    const bizResult = await db.query('SELECT id FROM businesses WHERE owner_id = $1', [user.id]);
    const business = bizResult.rows[0];

    if (!business) {
        return NextResponse.json({ success: true, notifications: [] });
    }

    // 2. Fetch conversations that 'Need Owner Response' as notifications
    // We could also create a dedicated notifications table, but this is a GREAT starts
    const notificationsRes = await db.query(
      `SELECT 
        c.id as conversation_id,
        u.name as customer_name,
        u.slug as customer_slug,
        lm.content as last_message,
        lm.created_at as time
       FROM conversations c
       LEFT JOIN users u ON c.customer_id = u.id
       LEFT JOIN LATERAL (
         SELECT content, created_at
         FROM messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC
         LIMIT 1
       ) lm ON TRUE
       WHERE c.business_id = $1 AND c.status = 'Needs Owner Response'
       ORDER BY lm.created_at DESC`,
      [business.id]
    );

    return NextResponse.json({
      success: true,
      notifications: notificationsRes.rows.map(n => ({
        id: n.conversation_id,
        title: `Message from ${n.customer_name || 'Guest'}`,
        message: n.last_message,
        time: n.time,
        link: `/business/conversation/${n.customer_slug}`,
        unread: true // Dynamic based on view status later?
      }))
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
