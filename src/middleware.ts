// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from './lib/db/schema';
import { eq } from 'drizzle-orm';

const PUBLIC_PATHS = ['/login', '/register'];
const MEMBER_PATH = '/member';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const token = request.cookies.get('session_token')?.value;

  const session = token ? await decrypt(token) : null;

  // 1. Jika pengguna sudah login dan berada di halaman publik, arahkan ke home
  if (isPublicPath && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Jika pengguna belum login dan mencoba akses halaman terproteksi, arahkan ke login
  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Jika pengguna sudah login, periksa perannya untuk pengalihan khusus
  if (session) {
    // Ambil role terbaru dari database untuk memastikan data akurat
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
      columns: { role: true },
    });

    const userRole = currentUser?.role;

    // Jika role adalah 'member'
    if (userRole === 'member') {
      // Izinkan akses hanya ke halaman /member
      if (pathname !== MEMBER_PATH) {
        return NextResponse.redirect(new URL(MEMBER_PATH, request.url));
      }
    } else {
      // Jika role BUKAN 'member' (admin, vip, dll.)
      // Jangan izinkan mereka mengakses halaman /member
      if (pathname === MEMBER_PATH) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
