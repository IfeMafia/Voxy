import { NextResponse } from 'next/server';
import { isAdmin, adminError } from '@/lib/adminAuth';
import db from '@/lib/db';

export async function GET() {
  try {
    const authStatus = await isAdmin();
    if (!authStatus.authorized) {
      return adminError(authStatus.error, authStatus.status);
    }

    // Get businesses with the most conversations
    const result = await db.query(`
      SELECT b.id, b.name, b.category, u.name as owner_name, u.email as owner_email, count(c.id) as total_conversations
      FROM businesses b
      JOIN users u ON b.owner_id = u.id
      LEFT JOIN conversations c ON c.business_id = b.id
      GROUP BY b.id, b.name, b.category, u.name, u.email
      ORDER BY total_conversations DESC
      LIMIT 20
    `);

    const businesses = result.rows.map(business => ({
      id: business.id,
      name: business.name,
      category: business.category,
      owner_name: business.owner_name,
      owner_email: business.owner_email,
      total_conversations: parseInt(business.total_conversations)
    }));

    return NextResponse.json({
      success: true,
      businesses
    });

  } catch (error) {
    console.error('Admin Business Ranking Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
