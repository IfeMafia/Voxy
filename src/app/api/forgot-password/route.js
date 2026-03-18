import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { TOKEN_TYPES, generateRawToken, storeToken, canRequestToken } from '@/lib/auth/tokens';
import { sendPasswordResetEmail } from '@/lib/mailer';

/**
 * Forgot Password API Route
 * 
 * In a real-world scenario, this would:
 * 1. Generate a secure, time-limited reset token.
 * 2. Store it in the database.
 * 3. Send an email via Resend, SendGrid, etc.
 * 
 * For now, this is a placeholder that simulates success.
 */
export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // 1. Find user by email
    const result = await db.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // SECURITY: Always return success to avoid email enumeration
    if (result.rowCount === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'If an account exists with that email, a reset link has been sent.' 
      });
    }

    const user = result.rows[0];

    // 2. Rate limit check (Max 3 per hour)
    const allowed = await canRequestToken(user.id, TOKEN_TYPES.PASSWORD_RESET, 3);
    if (!allowed) {
        return NextResponse.json({ 
            success: false, 
            error: 'Too many reset attempts. Please try again later.' 
        }, { status: 429 });
    }

    // 3. Generate and Store Token
    const rawToken = generateRawToken(TOKEN_TYPES.PASSWORD_RESET);
    const { tokenId } = await storeToken(user.id, TOKEN_TYPES.PASSWORD_RESET, rawToken, 15);

    // 4. Send Email
    const tokenIdentifier = `${tokenId}_${rawToken}`;
    await sendPasswordResetEmail(user.email, user.name, tokenIdentifier);

    return NextResponse.json({ 
      success: true, 
      message: 'If an account exists with that email, a reset link has been sent.' 
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
