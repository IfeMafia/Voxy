import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  fullName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = signupSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      logRequest({
        method: 'POST',
        path: '/api/v1/auth/signup',
        status: 400,
        latencyMs: Date.now() - startTime,
        error: issue.message,
      });
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const { email, password, fullName } = parseResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      logRequest({
        method: 'POST',
        path: '/api/v1/auth/signup',
        status: 409,
        latencyMs: Date.now() - startTime,
        error: 'Email already registered',
      });
      return errorResponse('USER_EXISTS', 'A user with this email already exists', 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName: fullName || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = signToken({ userId: user.id, email: user.email });

    logRequest({
      method: 'POST',
      path: '/api/v1/auth/signup',
      status: 201,
      latencyMs: Date.now() - startTime,
      userId: user.id,
    });

    return successResponse({ token, user }, 201);
  } catch (err: any) {
    logRequest({
      method: 'POST',
      path: '/api/v1/auth/signup',
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}
