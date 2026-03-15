import { NextResponse } from 'next/server';
import { signUp } from '@/lib/auth';
import { getAdminDb } from '@/lib/db';

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

    // Sign up with Supabase Auth
    // This handles user creation in Supabase internally
    const { data: authData, error: authError } = await signUp(email, password, { name });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    const { user } = authData;

    // Supabase Auth only creates the internal user. 
    // We manually sync/create the record in our public 'users' table 
    // if we want to keep using our schema-defined table.
    // Alternatively, you can use a Supabase Database Trigger (recommended).
    const supabaseAdmin = getAdminDb();
    const { data: newUser, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id, // Reference the Supabase Auth ID
        name,
        email,
        password_hash: 'managed_by_supabase' // No longer need to store this here
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database Sync Error:', dbError);
    }

    // Initialize credits for new user
    await supabaseAdmin
      .from('credits')
      .insert({ user_id: user.id, balance: 10 });

    return NextResponse.json(
      { 
        success: true, 
        message: 'User registered successfully. Please check your email for verification.', 
        user: { id: user.id, name, email } 
      },
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

