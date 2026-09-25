import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Модерация — только для ADMIN
    if (path.startsWith('/moderation') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Кабинет продавца — для SELLER и ADMIN
    if (path.startsWith('/dashboard') && !['SELLER', 'ADMIN'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    secret: process.env.NEXTAUTH_SECRET || 'super-secret-key-12th-squad-2026',
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/moderation/:path*'],
};