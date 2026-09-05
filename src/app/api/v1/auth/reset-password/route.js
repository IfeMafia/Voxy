import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
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
    const newPassword = parseResult.data.newPassword;

    // 1. Verify OTP token in database
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
        path: '/api/v1/auth/reset-password',
        status: 400,
        latencyMs: Date.now() - startTime,
        error: 'Invalid or expired OTP',
      });
      return errorResponse('INVALID_OTP', 'Invalid or expired verification code', 400);
    }

    // 2. Find business user
    const business = await prisma.business.findUnique({
      where: { email },
    });

    if (!business) {
      return errorResponse('NOT_FOUND', 'Business account not found', 404);
    }

    // 3. Hash new password & update
    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.business.update({
        where: { id: business.id },
        data: { passwordHash },
      }),
      prisma.otpToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      }),
    ]);

    logRequest({
      method: 'POST',
      path: '/api/v1/auth/reset-password',
      status: 200,
      latencyMs: Date.now() - startTime,
      userId: business.id,
    });

    return successResponse({
      message: 'Password has been reset successfully. You can now sign in.',
    });
  } catch (err) {
    logRequest({
      method: 'POST',
      path: '/api/v1/auth/reset-password',
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err?.message,
    });
    return errorResponse('SERVER_ERROR', 'Failed to reset password', 500);
  }
}
