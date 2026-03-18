import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { ai_enabled, ai_allowed } = body;
    
    // Check if the user is the owner of this business/conversation
    const convRes = await db.query(
      `SELECT c.*, b.owner_id 
       FROM conversations c 
       JOIN businesses b ON c.business_id = b.id 
       WHERE c.id = $1`, 
      [id]
    );
    const conv = convRes.rows[0];
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    const isOwner = conv.owner_id === user.id;

    if (ai_allowed !== undefined) {
      if (!isOwner) {
        return NextResponse.json({ success: false, error: 'Only business owners can toggle AI availability' }, { status: 403 });
      }
      await db.query('UPDATE conversations SET ai_allowed = $1 WHERE id = $2', [ai_allowed, id]);
    }

    if (ai_enabled !== undefined) {
      await db.query('UPDATE conversations SET ai_enabled = $1 WHERE id = $2', [ai_enabled, id]);
    }

    return NextResponse.json({ 
      success: true, 
      ai_enabled: ai_enabled ?? conv.ai_enabled,
      ai_allowed: ai_allowed ?? conv.ai_allowed
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
