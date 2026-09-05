import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { logRequest } from '@/lib/logger';
import { sendPasswordResetOTP } from '@/lib/mailer';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
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

    const business = await prisma.business.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (business) {
      // 1. Generate secure 6-digit numeric OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // 2. Invalidate any existing unused OTPs for this email
      await prisma.otpToken.deleteMany({
        where: { email, type: 'PASSWORD_RESET' },
      });

      // 3. Store the new OTP
      await prisma.otpToken.create({
        data: {
          email,
          otp,
          type: 'PASSWORD_RESET',
          expiresAt,
          used: false,
        },
      });

      // 4. Send the OTP via email
      await sendPasswordResetOTP(business.email, business.name, otp);
    }

    logRequest({
      method: 'POST',
      path: '/api/v1/auth/forgot-password',
      status: 200,
      latencyMs: Date.now() - startTime,
    });

    return successResponse({
      message: 'If an account exists with this email, a 6-digit verification code has been sent.',
    });
  } catch (err) {
    logRequest({
      method: 'POST',
      path: '/api/v1/auth/forgot-password',
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err?.message,
    });
    return errorResponse('SERVER_ERROR', 'Failed to process password reset request', 500);
  }
}
