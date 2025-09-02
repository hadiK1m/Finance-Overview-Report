// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: 'Logout successful.' },
      { status: 200 }
    );

    // Hapus cookie dengan mengatur maxAge menjadi 0
    response.cookies.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Set tanggal kedaluwarsa di masa lalu
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
