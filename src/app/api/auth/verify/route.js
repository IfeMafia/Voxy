import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { TOKEN_TYPES, verifyAndConsumeToken } from '@/lib/auth/tokens';
import { sendWelcomeEmail } from '@/lib/mailer';

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // 1. Find user
    const result = await db.query(
      'SELECT id, name, email, is_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];

    if (user.is_verified) {
      return NextResponse.json({ success: true, message: 'Account already verified' });
    }

    // 2. Verify and Consume OTP from auth_tokens table
    const verification = await verifyAndConsumeToken(user.id, TOKEN_TYPES.EMAIL_VERIFICATION, otp);

    if (!verification.success) {
      return NextResponse.json({ success: false, error: verification.error }, { status: 400 });
    }

    // 3. Success - Mark as verified in users table
    await db.query('UPDATE users SET is_verified = true WHERE id = $1', [user.id]);

    // 4. Send Welcome Email
    sendWelcomeEmail(user.email, user.name).catch(err => console.error('Welcome email error:', err));

    return NextResponse.json({
      success: true,
      message: 'Account verified successfully! You can now log in.'
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
