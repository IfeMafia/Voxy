import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
// import { query } from '@/lib/db'; // Will be used for real logic

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Placeholder Logic: In a real app, you would:
    // 1. Validate email and password presence
    // 2. Fetch user from DB using 'query'
    // 3. Compare hashed password (bcrypt)
    
    // Example placeholder response
    if (email === "demo@voxy.ai" && password === "password123") {
      const token = signToken({ userId: 'demo-user-id', email });
      
      return NextResponse.json({ 
        success: true, 
        message: "Login successful",
        token,
        user: { id: 'demo-user-id', email: "demo@voxy.ai", name: "Demo User" }
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
