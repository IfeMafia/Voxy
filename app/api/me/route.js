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

    // Optional: Fetch fresh user data from DB to ensure name/role are current
    const result = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [payload.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Session Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
