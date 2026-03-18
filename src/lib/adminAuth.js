import { NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import db from '@/lib/db';

export async function isAdmin() {
  const user = await getUserFromCookie();
  
  if (!user || user.role !== 'admin') {
    return { authorized: false, error: 'Unauthorized: Admin access required' };
  }

  return { authorized: true, user };
}

export function adminError(error, status = 403) {
  return NextResponse.json({ success: false, error }, { status });
}
