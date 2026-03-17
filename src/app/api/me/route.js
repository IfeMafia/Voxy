import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const payload = await getUserFromCookie();

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user data and join with businesses if they are a business owner
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, b.id as business_id, b.logo_url
       FROM users u
       LEFT JOIN businesses b ON b.owner_id = u.id
       WHERE u.id = $1`,
      [payload.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = result.rows[0];
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role
    };

    // If it's a business owner, nest the business details
    if (userData.role === 'business' || userData.role === 'business_owner' || userData.business_id) {
      user.business = {
        id: userData.business_id,
        logo_url: userData.logo_url
      };
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Session Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
