import { NextResponse } from 'next/server';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
import db from '@/lib/db';

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

    // 4. Create user
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, role]
    );

    const newUser = result.rows[0];

    // 5. Generate JWT and set Cookie
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    await setAuthCookie(token);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Registration successful',
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
