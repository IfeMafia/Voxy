import { NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';

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

    // Sign in with Supabase
    const { data, error } = await signIn(email, password);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    const { user, session } = data;

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      token: session.access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

