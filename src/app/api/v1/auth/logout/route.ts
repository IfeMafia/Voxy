import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  logRequest({
    method: 'POST',
    path: '/api/v1/auth/logout',
    status: 200,
    latencyMs: Date.now() - startTime,
  });

  const response = successResponse({ message: 'Logged out successfully' });
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
