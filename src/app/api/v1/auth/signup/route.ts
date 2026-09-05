import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';
import { generateUniqueSlug } from '@/lib/slug';

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  name: z.string().min(1, { message: 'Business name is required' }),
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

    const { email, password, name } = parseResult.data;

    const existingBusiness = await prisma.business.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingBusiness) {
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
    const slug = await generateUniqueSlug(name);

    const business = await prisma.business.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        slug,
      },
      select: {
        id: true,
        email: true,
        name: true,
        slug: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = signToken({ businessId: business.id, email: business.email });

    logRequest({
      method: 'POST',
      path: '/api/v1/auth/signup',
      status: 201,
      latencyMs: Date.now() - startTime,
      userId: business.id,
    });

    const response = successResponse({ token, business }, 201);
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
      path: '/api/v1/auth/signup',
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err.message,
    });
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}
