import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req) {
  try {
    const decoded = getUserFromRequest(req);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch fresh user data from database (minus password)
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
