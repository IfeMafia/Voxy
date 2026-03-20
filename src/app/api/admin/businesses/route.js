import { NextResponse } from 'next/server';
import { getAllBusinesses } from '@/lib/admin_queries/admin';
import { getUserFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const businesses = await getAllBusinesses();
    return NextResponse.json({ 
      success: true, 
      businesses 
    });
  } catch (error) {
    console.error('Admin API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
