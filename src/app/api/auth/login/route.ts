// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth'; // Impor fungsi encrypt

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // Buat sesi/token menggunakan jose
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam dari sekarang
    const session = await encrypt({
      userId: user.id,
      email: user.email,
      expires,
    });

    const response = NextResponse.json(
      { message: 'Login successful.' },
      { status: 200 }
    );

    // Atur cookie
    response.cookies.set('session_token', session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
