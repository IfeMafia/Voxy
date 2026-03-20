import { NextResponse } from 'next/server';
import { getPlatformAnalytics } from '@/lib/admin_queries/admin';
import { getUserFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const analytics = await getPlatformAnalytics();
    return NextResponse.json({ 
      success: true, 
      analytics 
    });
  } catch (error) {
    console.error('Admin API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
