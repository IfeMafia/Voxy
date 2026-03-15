import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide email and password' },
        { status: 400 }
      );
    }

    // Find user by email
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare passwords
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email });

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
