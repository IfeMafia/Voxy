import { NextResponse } from 'next/server';
import { comparePassword, generateToken, setAuthCookie } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // 1. Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 2. Find user
    const result = await db.query(
      'SELECT id, name, email, password_hash, role, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('Login attempt for:', email);
    const user = result.rows[0];
    console.log('User found:', user ? { email: user.email, role: user.role, is_verified: user.is_verified } : 'None');

    // 3. Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password validation failed for user:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 3b. Check verification status
    if (!user.is_verified) {
      console.log('Account not verified for user:', email);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please verify your account before logging in.', 
          requiresVerification: true,
          email: user.email 
        },
        { status: 403 }
      );
    }

    // Log user role before generating token
    console.log('User role for successful login:', user.role);

    // 4. Generate JWT and set Cookie
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
