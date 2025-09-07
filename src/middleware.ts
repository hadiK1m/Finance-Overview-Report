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

  // Aturan 1: Jika sudah login, jangan biarkan akses halaman login/register
  if (isPublicPath && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Aturan 2: Jika belum login, paksa ke halaman login
  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Aturan 3: Jika sudah login, periksa peran untuk pengalihan khusus
  if (session) {
    const currentUser = await db.query.users.findFirst({
      columns: {
        role: true,
      },
      where: eq(users.id, session.userId),
    });

    const userRole = currentUser?.role;

    if (userRole === 'member') {
      // Jika peran adalah 'member', hanya izinkan akses ke halaman /member
      if (pathname !== MEMBER_PATH) {
        return NextResponse.redirect(new URL(MEMBER_PATH, request.url));
      }
    } else {
      // Jika peran BUKAN 'member', jangan biarkan akses ke halaman /member
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
