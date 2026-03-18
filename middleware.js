import { NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth';

const TOKEN_NAME = 'voxy_auth_token';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect Admin Dashboard (/lighthouse/**/*)
  if (pathname.startsWith('/lighthouse')) {
    // BYPASS FOR TESTING: Commenting out the strict check
    /*
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    const user = await verifyTokenEdge(token);
    if (!user || user.role !== 'admin') return NextResponse.redirect(new URL('/', request.url));
    */
    return NextResponse.next();
  }

  // General Dashboard Protection (if needed)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/customer')) {
     const token = request.cookies.get(TOKEN_NAME)?.value;
     if (!token) {
       return NextResponse.redirect(new URL('/login', request.url));
     }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/lighthouse/:path*',
    '/dashboard/:path*',
    '/customer/:path*',
  ],
};