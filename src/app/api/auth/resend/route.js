import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { TOKEN_TYPES, generateRawToken, storeToken, canRequestToken } from '@/lib/auth/tokens';
import { sendVerificationEmail } from '@/lib/mailer';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // 1. Find user
    const result = await db.query(
      'SELECT id, name, email, is_verified, otp_request_count, last_otp_request FROM users WHERE email = $1',
      [email]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    if (user.is_verified) {
      return NextResponse.json({ success: true, message: 'Account already verified' });
    }

    // 2. Rate limiting check (Built into the new token system)
    const allowed = await canRequestToken(user.id, TOKEN_TYPES.EMAIL_VERIFICATION, 3);
    if (!allowed) {
        return NextResponse.json({ 
            success: false, 
            error: 'Too many requests. Please try again in an hour.' 
        }, { status: 429 });
    }

    // 3. Generate AND Store New OTP
    const rawOtp = generateRawToken(TOKEN_TYPES.EMAIL_VERIFICATION);
    await storeToken(user.id, TOKEN_TYPES.EMAIL_VERIFICATION, rawOtp, 10);

    // 4. Send email
    try {
      await sendVerificationEmail(user.email, user.name, rawOtp);
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'New verification code sent to your email.'
    });

  } catch (error) {
    console.error('Resend OTP Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
