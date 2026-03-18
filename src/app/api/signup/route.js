import { NextResponse } from 'next/server';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
import db from '@/lib/db';
import { getUniqueSlug } from '@/lib/utils';
import { sendVerificationEmail } from '@/lib/mailer';
import { TOKEN_TYPES, generateRawToken, storeToken } from '@/lib/auth/tokens';

export async function POST(req) {
  try {
    const { name, email, password, role = 'customer' } = await req.json();

    // 1. Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rowCount > 0) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      );
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Generate unique slug
    const slug = await getUniqueSlug('users', name || email.split('@')[0], db);

    // 5. Create user (unverified)
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role, slug, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, slug',
      [name, email.toLowerCase(), passwordHash, role, slug, false]
    );

    const newUser = result.rows[0];

    // 6. Generate and Store Verification OTP
    const rawOtp = generateRawToken(TOKEN_TYPES.EMAIL_VERIFICATION);
    await storeToken(newUser.id, TOKEN_TYPES.EMAIL_VERIFICATION, rawOtp, 10);

    // 7. Send Verification Email
    try {
      await sendVerificationEmail(newUser.email, newUser.name, rawOtp);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created! Please check your email for a verification code.',
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
