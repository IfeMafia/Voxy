import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'POST',
        path: '/api/v1/auth/login',
        status: 400,
        latencyMs: Date.now() - startTime,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { email, password } = parseResult.data;

    const business = await prisma.business.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!business) {
      logRequest({
        method: 'POST',
        path: '/api/v1/auth/login',
        status: 401,
        latencyMs: Date.now() - startTime,
        error: 'Invalid email or password',
      });
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const isMatch = await comparePassword(password, business.passwordHash);
    if (!isMatch) {
      logRequest({
        method: 'POST',
        path: '/api/v1/auth/login',
        status: 401,
        latencyMs: Date.now() - startTime,
        error: 'Invalid email or password',
      });
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const token = signToken({ businessId: business.id, email: business.email });

    logRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: business.id,
    });

    const isDemo = business.email.toLowerCase() === 'ifemafiaa@gmail.com';

    const businessResponse = {
      id: business.id,
      email: business.email,
      name: business.name,
      slug: business.slug,
      isVerified: business.isVerified,
      isDemo,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
    };

    const response = successResponse({ token, business: businessResponse });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err: any) {
    logRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}
