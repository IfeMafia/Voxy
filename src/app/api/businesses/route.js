import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { getUniqueSlug } from '@/lib/utils';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const isPublic = searchParams.get('public') === 'true';

    // 1. PUBLIC QUERY: Fetch all verified/live businesses
    if (isPublic) {
      const result = await db.query(
        'SELECT id, name, slug, description, category, custom_category, profile_completion, is_live, logo_url, use_ai_reply FROM businesses WHERE is_live = true'
      );
      return NextResponse.json({ 
        success: true, 
        businesses: result.rows 
      });
    }

    // 2. PRIVATE QUERY: Fetch owner's specific business
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.query(
      'SELECT * FROM businesses WHERE owner_id = $1',
      [user.id]
    );

    return NextResponse.json({ 
      success: true, 
      business: result.rows[0] || null 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { buildBusinessSummary } from '@/lib/ai-context';

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      name, description, category, custom_category, 
      assistant_tone, assistant_instructions, business_hours,
      profile_completion, is_live, logo_url, use_ai_reply
    } = body;

    // Check if business exists
    const existing = await db.query(
      'SELECT id FROM businesses WHERE owner_id = $1',
      [user.id]
    );

    let result;
    if (existing.rowCount > 0) {
      // Update
      // Get existing slug or generate new one if missing
      const existingBusiness = (await db.query('SELECT slug FROM businesses WHERE owner_id = $1', [user.id])).rows[0];
      let slug = existingBusiness.slug;
      if (!slug) {
        slug = await getUniqueSlug('businesses', name, db);
      }

      result = await db.query(
        `UPDATE businesses SET 
          name = $1, description = $2, category = $3, 
          custom_category = $4, assistant_tone = $5, 
          assistant_instructions = $6, business_hours = $7,
          profile_completion = $8, is_live = $9, logo_url = $11,
          slug = $12, use_ai_reply = $13,
          updated_at = CURRENT_TIMESTAMP
        WHERE owner_id = $10 RETURNING *`,
        [
          name, description, category, custom_category, 
          assistant_tone, assistant_instructions, JSON.stringify(business_hours),
          profile_completion, is_live, user.id, logo_url, slug, use_ai_reply
        ]
      );
    } else {
      // Insert
      const slug = await getUniqueSlug('businesses', name, db);
      result = await db.query(
        `INSERT INTO businesses (
          owner_id, name, description, category, 
          custom_category, assistant_tone, assistant_instructions, 
          business_hours, profile_completion, is_live, logo_url, slug, use_ai_reply
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        [
          user.id, name, description, category, 
          custom_category, assistant_tone, assistant_instructions, 
          JSON.stringify(business_hours), profile_completion, is_live, logo_url, slug, use_ai_reply
        ]
      );
    }

    // [CRITICAL] Recalculate AI Summary to sync with new settings
    if (result.rows[0]) {
      console.log(`[AI-SYNC] Recalculating summary for business ${result.rows[0].id}...`);
      await buildBusinessSummary(result.rows[0].id);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Business settings saved", 
      business: result.rows[0] 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
