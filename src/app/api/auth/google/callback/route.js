import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateToken, setAuthCookie } from '@/lib/auth';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${BASE_URL}/api/auth/google/callback`;

  if (error || !code) {
    return NextResponse.redirect(`${BASE_URL}/login?error=google_denied`);
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[Google OAuth] Token exchange failed:', tokenData);
      return NextResponse.redirect(`${BASE_URL}/login?error=google_token_failed`);
    }

    // 2. Fetch user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userInfoRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(`${BASE_URL}/login?error=google_no_email`);
    }

    // 3. Upsert user in database
    const existing = await db.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      [googleUser.email]
    );

    let user;
    if (existing.rowCount > 0) {
      user = existing.rows[0];
      // Update avatar if not set
      await db.query(
        'UPDATE users SET name = COALESCE(name, $1), logo_url = COALESCE(logo_url, $2), google_id = $3 WHERE email = $4',
        [googleUser.name, googleUser.picture, googleUser.id, googleUser.email]
      );
    } else {
      // Create new user — default role is 'customer', they can onboard to business
      const result = await db.query(
        `INSERT INTO users (name, email, role, google_id, logo_url, password_hash) 
         VALUES ($1, $2, 'customer', $3, $4, '') RETURNING id, name, email, role`,
        [googleUser.name, googleUser.email, googleUser.id, googleUser.picture]
      );
      user = result.rows[0];
    }

    // 4. Generate JWT and set cookie
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await setAuthCookie(token);

    // 5. Redirect to appropriate dashboard
    const routes = {
      customer: '/customer/chat',
      business: '/business/dashboard',
      admin: '/lighthouse/dashboard',
    };
    const target = routes[user.role] || routes.customer;

    return NextResponse.redirect(`${BASE_URL}${target}`);
  } catch (err) {
    console.error('[Google OAuth Callback] Error:', err);
    return NextResponse.redirect(`${BASE_URL}/login?error=server_error`);
  }
}
