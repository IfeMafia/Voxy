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
    const businessId = searchParams.get('businessId');
    
    let result;
    if (businessId) {
      // Find specific conversation between user and business (if applicable)
      // Since we don't have a user_id on conversations yet, we might need to add it or use sessions
      // For now, let's fetch all conversations for the business if the user is the owner
      result = await db.query(
        'SELECT * FROM conversations WHERE business_id = $1 ORDER BY updated_at DESC',
        [businessId]
      );
    } else {
      // Fetch all conversations for the owner's business
      result = await db.query(
        `SELECT c.*, b.name as business_name 
         FROM conversations c
         JOIN businesses b ON c.business_id = b.id
         WHERE b.owner_id = $1
         ORDER BY c.updated_at DESC`,
        [user.id]
      );
    }

    return NextResponse.json({ success: true, conversations: result.rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    const body = await req.json();
    const { businessId, customerName } = body;

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID is required' }, { status: 400 });
    }

    // Check if conversation already exists (simplify: for now always create or find)
    const existing = await db.query(
      'SELECT id FROM conversations WHERE business_id = $1 AND customer_name = $2 LIMIT 1',
      [businessId, customerName || (user ? user.name : 'Guest')]
    );

    if (existing.rowCount > 0) {
      return NextResponse.json({ success: true, id: existing.rows[0].id, message: "Existing conversation found" });
    }

    const result = await db.query(
      'INSERT INTO conversations (business_id, customer_name, status) VALUES ($1, $2, $3) RETURNING id',
      [businessId, customerName || (user ? user.name : 'Guest'), 'AI Responding']
    );

    return NextResponse.json({ 
      success: true, 
      message: "Conversation started", 
      id: result.rows[0].id 
    }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
