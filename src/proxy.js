import { NextResponse } from 'next/server';

export default async function middleware(request) {
  // TOTAL BYPASS FOR TESTING
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
