// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const session = await decrypt(token);
    if (!session?.userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Ambil data pengguna dari database untuk mendapatkan role terbaru
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
      columns: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user: currentUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
