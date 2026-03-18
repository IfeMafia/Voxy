import { NextResponse } from 'next/server';
import { isAdmin, adminError } from '@/lib/adminAuth';
import db from '@/lib/db';

export async function GET() {
  try {
    const authStatus = await isAdmin();
    if (!authStatus.authorized) {
      return adminError(authStatus.error, authStatus.status);
    }

    // List all users with their business name (if they have one)
    const result = await db.query(`
      SELECT u.id, u.email, u.name, u.role, u.created_at, b.name as business_name
      FROM users u
      LEFT JOIN businesses b ON b.owner_id = u.id
      ORDER BY u.created_at DESC
    `);

    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
      business_name: user.business_name
    }));

    return NextResponse.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Admin Users List Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
