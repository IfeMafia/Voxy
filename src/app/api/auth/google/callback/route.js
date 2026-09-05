import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { generateUniqueSlug } from '@/lib/slug';

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    const errorMsg = error || 'Authorization code missing';
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/login?error=GoogleAuthNotConfigured`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[Google OAuth Token Error]', errBody);
      return NextResponse.redirect(`${appUrl}/login?error=FailedToExchangeGoogleToken`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Google profile info
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(`${appUrl}/login?error=FailedToFetchGoogleProfile`);
    }

    const profile = await profileRes.json();
    const email = profile.email?.toLowerCase();
    const name = profile.name || profile.given_name || 'Business Owner';
    const picture = profile.picture || null;

    if (!email) {
      return NextResponse.redirect(`${appUrl}/login?error=GoogleAccountHasNoEmail`);
    }

    // 3. Find or create Business record
    let business = await prisma.business.findUnique({
      where: { email },
    });

    if (!business) {
      const slug = await generateUniqueSlug(name);
      const dummyPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(dummyPassword);

      business = await prisma.business.create({
        data: {
          email,
          name,
          slug,
          logoUrl: picture,
          passwordHash,
          isVerified: true,
        },
      });
    } else if (picture && !business.logoUrl) {
      business = await prisma.business.update({
        where: { id: business.id },
        data: { logoUrl: picture },
      });
    }

    // 4. Generate JWT
    const token = signToken({
      businessId: business.id,
      email: business.email,
    });

    // 5. Build response with auth cookie and redirect
    const redirectTarget = `${appUrl}/login?google_token=${encodeURIComponent(token)}`;
    const response = NextResponse.redirect(redirectTarget);

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('[Google OAuth Error]', err);
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(err?.message || 'OAuthError')}`);
  }
}
