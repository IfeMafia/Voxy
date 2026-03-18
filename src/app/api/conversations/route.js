import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { detectSentiment } from '@/lib/sentiment';

export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const conversationId = searchParams.get('conversationId');
    
    let result;
    if (user.role === 'customer') {
      if (conversationId) {
        result = await db.query(
          `SELECT c.*, b.name AS business_name, b.slug AS business_slug,
                  lm.content AS last_message,
                  lm.created_at AS last_message_at,
                  lcm.content AS last_customer_message
           FROM conversations c
           JOIN businesses b ON c.business_id = b.id
           LEFT JOIN LATERAL (
             SELECT content, created_at
             FROM messages
             WHERE conversation_id = c.id
             ORDER BY created_at DESC
             LIMIT 1
           ) lm ON TRUE
           LEFT JOIN LATERAL (
             SELECT content
             FROM messages
             WHERE conversation_id = c.id AND sender_type = 'customer'
             ORDER BY created_at DESC
             LIMIT 1
           ) lcm ON TRUE
           WHERE c.id = $1 AND c.customer_id = $2
           LIMIT 1`,
          [conversationId, user.id]
        );
      } else if (businessId) {
        result = await db.query(
          `SELECT c.*, b.name AS business_name, b.slug AS business_slug,
                  lm.content AS last_message,
                  lm.created_at AS last_message_at,
                  lcm.content AS last_customer_message
           FROM conversations c
           JOIN businesses b ON c.business_id = b.id
           LEFT JOIN LATERAL (
             SELECT content, created_at
             FROM messages
             WHERE conversation_id = c.id
             ORDER BY created_at DESC
             LIMIT 1
           ) lm ON TRUE
           LEFT JOIN LATERAL (
             SELECT content
             FROM messages
             WHERE conversation_id = c.id AND sender_type = 'customer'
             ORDER BY created_at DESC
             LIMIT 1
           ) lcm ON TRUE
           WHERE c.customer_id = $1 AND c.business_id = $2
           ORDER BY c.created_at DESC
           LIMIT 1`,
          [user.id, businessId]
        );
      } else {
        result = await db.query(
          `SELECT c.*, b.name AS business_name, b.slug AS business_slug,
                  lm.content AS last_message,
                  lm.created_at AS last_message_at,
                  lcm.content AS last_customer_message
           FROM conversations c
           JOIN businesses b ON c.business_id = b.id
           LEFT JOIN LATERAL (
             SELECT content, created_at
             FROM messages
             WHERE conversation_id = c.id
             ORDER BY created_at DESC
             LIMIT 1
           ) lm ON TRUE
           LEFT JOIN LATERAL (
             SELECT content
             FROM messages
             WHERE conversation_id = c.id AND sender_type = 'customer'
             ORDER BY created_at DESC
             LIMIT 1
           ) lcm ON TRUE
           WHERE c.customer_id = $1
           ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
          [user.id]
        );
      }
    } else {
      let query = `
        SELECT c.*, b.name as business_name, b.slug as business_slug,
               u.name as actual_customer_name, u.slug as customer_slug,
               lm.content AS last_message,
               lm.created_at AS last_message_at,
               lcm.content AS last_customer_message
        FROM conversations c
        JOIN businesses b ON c.business_id = b.id
        LEFT JOIN users u ON c.customer_id = u.id
        LEFT JOIN LATERAL (
          SELECT content, created_at
          FROM messages
          WHERE conversation_id = c.id
          ORDER BY created_at DESC
          LIMIT 1
        ) lm ON TRUE
        LEFT JOIN LATERAL (
          SELECT content
          FROM messages
          WHERE conversation_id = c.id AND sender_type = 'customer'
          ORDER BY created_at DESC
          LIMIT 1
        ) lcm ON TRUE
        WHERE b.owner_id = $1
      `;
      const params = [user.id];

      if (conversationId) {
        query += ` AND c.id = $2`;
        params.push(conversationId);
      }

      query += ` ORDER BY COALESCE(lm.created_at, c.created_at) DESC`;
      
      result = await db.query(query, params);
      
      result.rows = result.rows.map(conv => ({
        ...conv,
        customer_name: conv.actual_customer_name || conv.customer_name || 'Guest'
      }));
    }

    // Attach computed sentiment to all responses
    result.rows = result.rows.map(conv => ({
      ...conv,
      sentiment: detectSentiment(conv.last_customer_message || conv.last_message)
    }));

    return NextResponse.json({ success: true, conversations: result.rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID is required' }, { status: 400 });
    }

    // Check if this customer already has a conversation with this business.
    const existing = await db.query(
      'SELECT id, ai_enabled, ai_allowed FROM conversations WHERE customer_id = $1 AND business_id = $2 LIMIT 1',
      [user.id, businessId]
    );

    if (existing.rowCount > 0) {
      return NextResponse.json({ 
        success: true, 
        id: existing.rows[0].id, 
        ai_enabled: existing.rows[0].ai_enabled,
        ai_allowed: existing.rows[0].ai_allowed ?? true,
        message: "Existing conversation found" 
      });
    }

    const result = await db.query(
      'INSERT INTO conversations (customer_id, business_id, status, ai_enabled, ai_allowed) VALUES ($1, $2, $3, $4, $5) RETURNING id, ai_enabled, ai_allowed',
      [user.id, businessId, 'AI Responding', true, true]
    );

    return NextResponse.json({ 
      success: true, 
      message: "Conversation started", 
      id: result.rows[0].id,
      ai_enabled: result.rows[0].ai_enabled,
      ai_allowed: result.rows[0].ai_allowed
    }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
