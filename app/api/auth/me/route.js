import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Placeholder Logic: In a real app, you would fetch fresh user data from DB
    return NextResponse.json({ 
      success: true, 
      user: { ...user, name: "Demo User" } 
    });

  } catch (error) {
    console.error('Me API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
