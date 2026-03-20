import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromCookie } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const conversationId = searchParams.get("conversationId");

    let result;
    if (user.role === "customer") {
      if (conversationId) {
        result = await db.query(
          `SELECT c.*, b.name AS business_name,
                  lm.content AS last_message,
                  lm.created_at AS last_message_at
           FROM conversations c
           JOIN businesses b ON c.business_id = b.id
           LEFT JOIN LATERAL (
             SELECT content, created_at
             FROM messages
             WHERE conversation_id = c.id
             ORDER BY created_at DESC
             LIMIT 1
           ) lm ON TRUE
           WHERE c.id = $1 AND c.customer_id = $2
           LIMIT 1`,
          [conversationId, user.id],
        );
      } else if (businessId) {
        result = await db.query(
          `SELECT c.*, b.name AS business_name,
                  lm.content AS last_message,
                  lm.created_at AS last_message_at
           FROM conversations c
           JOIN businesses b ON c.business_id = b.id
           LEFT JOIN LATERAL (
             SELECT content, created_at
             FROM messages
             WHERE conversation_id = c.id
             ORDER BY created_at DESC
             LIMIT 1
           ) lm ON TRUE
           WHERE c.customer_id = $1 AND c.business_id = $2
           ORDER BY c.created_at DESC
           LIMIT 1`,
          [user.id, businessId],
        );
      } else {
        result = await db.query(
          `SELECT c.*, b.name AS business_name,
                  lm.content AS last_message,
                  lm.created_at AS last_message_at
           FROM conversations c
           JOIN businesses b ON c.business_id = b.id
           LEFT JOIN LATERAL (
             SELECT content, created_at
             FROM messages
             WHERE conversation_id = c.id
             ORDER BY created_at DESC
             LIMIT 1
           ) lm ON TRUE
           WHERE c.customer_id = $1
           ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
          [user.id],
        );
      }
    } else {
      result = await db.query(
        `SELECT c.*, b.name as business_name,
                lm.content AS last_message,
                lm.created_at AS last_message_at
         FROM conversations c
         JOIN businesses b ON c.business_id = b.id
         LEFT JOIN LATERAL (
           SELECT content, created_at
           FROM messages
           WHERE conversation_id = c.id
           ORDER BY created_at DESC
           LIMIT 1
         ) lm ON TRUE
         WHERE b.owner_id = $1
         ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
        [user.id],
      );
    }

    return NextResponse.json({ success: true, conversations: result.rows });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "Business ID is required" },
        { status: 400 },
      );
    }

    // Check if this customer already has a conversation with this business.
    const existing = await db.query(
      "SELECT id FROM conversations WHERE customer_id = $1 AND business_id = $2 LIMIT 1",
      [user.id, businessId],
    );

    if (existing.rowCount > 0) {
      return NextResponse.json({
        success: true,
        id: existing.rows[0].id,
        message: "Existing conversation found",
      });
    }

    const result = await db.query(
      "INSERT INTO conversations (customer_id, business_id, status) VALUES ($1, $2, $3) RETURNING id",
      [user.id, businessId, "AI Responding"],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Conversation started",
        id: result.rows[0].id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
