import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
});

export async function POST(req) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = schema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return errorResponse('VALIDATION_ERROR', issue.message, 400);
    }

    const email = parseResult.data.email.toLowerCase().trim();
    const otp = parseResult.data.otp.trim();

    const tokenRecord = await prisma.otpToken.findFirst({
      where: {
        email,
        otp,
        type: 'PASSWORD_RESET',
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!tokenRecord) {
      logRequest({
        method: 'POST',
        path: '/api/v1/auth/verify-otp',
        status: 400,
        latencyMs: Date.now() - startTime,
        error: 'Invalid or expired OTP',
      });
      return errorResponse('INVALID_OTP', 'Invalid or expired verification code', 400);
    }

    logRequest({
      method: 'POST',
      path: '/api/v1/auth/verify-otp',
      status: 200,
      latencyMs: Date.now() - startTime,
    });

    return successResponse({
      valid: true,
      message: 'OTP verified successfully',
    });
  } catch (err) {
    logRequest({
      method: 'POST',
      path: '/api/v1/auth/verify-otp',
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err?.message,
    });
    return errorResponse('SERVER_ERROR', 'Failed to verify code', 500);
  }
}
