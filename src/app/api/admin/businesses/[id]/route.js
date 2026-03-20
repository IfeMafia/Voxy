import { NextResponse } from 'next/server';
import { getBusinessDetails, updateBusinessStatus } from '@/lib/admin_queries/admin';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const business = await getBusinessDetails(id);
    
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      business 
    });
  } catch (error) {
    console.error('Admin API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const success = await updateBusinessStatus(id, status);
    
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Admin API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
