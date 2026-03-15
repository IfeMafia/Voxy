import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide all fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const userExists = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, hashedPassword]
    );

    const newUser = result.rows[0];

    // Initialize credits for new user
    await query('INSERT INTO credits (user_id, balance) VALUES ($1, $2)', [newUser.id, 10]); // Give 10 starter credits

    // Generate token
    const token = generateToken({ id: newUser.id, email: newUser.email });

    return NextResponse.json(
      { success: true, message: 'User registered successfully', token, user: newUser },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
