// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db/middleware-db'; // Penggunaan middleware-db sudah benar
import { users } from './lib/db/schema';
import { eq } from 'drizzle-orm';

const PUBLIC_PATHS = ['/login', '/register'];
const MEMBER_PATH = '/member';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const token = request.cookies.get('session_token')?.value;

  const session = token ? await decrypt(token) : null;

  if (isPublicPath && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session) {
    const [currentUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const userRole = currentUser?.role;

    if (userRole === 'member') {
      if (pathname !== MEMBER_PATH) {
        return NextResponse.redirect(new URL(MEMBER_PATH, request.url));
      }
    } else {
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

// Tambahkan baris ini di akhir file
export const runtime = 'nodejs';
