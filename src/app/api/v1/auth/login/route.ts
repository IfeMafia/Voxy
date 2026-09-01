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

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      logRequest({
        method: 'POST',
        path: '/api/v1/auth/login',
        status: 401,
        latencyMs: Date.now() - startTime,
        error: 'Invalid email or password',
      });
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
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

    const token = signToken({ userId: user.id, email: user.email });

    logRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: user.id,
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return successResponse({ token, user: userResponse });
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
