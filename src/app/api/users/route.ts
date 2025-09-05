// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userRoleEnum } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import * as z from 'zod';
import { decrypt } from '@/lib/auth';

// Skema untuk validasi update role
const updateUserRoleSchema = z.object({
  id: z.number(),
  role: z.enum(userRoleEnum.enumValues),
});

// Handler untuk GET (mengambil semua pengguna)
export async function GET() {
  try {
    // Di masa depan, Anda mungkin ingin membatasi ini hanya untuk admin
    const allUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json(allUsers, { status: 200 });
  } catch (error) {
    console.error('API GET Error (users):', error);
    return NextResponse.json(
      { message: 'Failed to fetch users.' },
      { status: 500 }
    );
  }
}

// === HANDLER PATCH UNTUK MENGUBAH ROLE ===
export async function PATCH(request: Request) {
  // 1. Cek otorisasi admin
  const token = request.headers
    .get('cookie')
    ?.split('session_token=')[1]
    ?.split(';')[0];
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const session = await decrypt(token);
  if (!session?.userId) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  const adminUser = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });

  if (adminUser?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden: Admins only.' },
      { status: 403 }
    );
  }

  // 2. Lanjutkan dengan logika update
  try {
    const body = await request.json();
    const { id, role } = updateUserRoleSchema.parse(body);

    // Admin tidak bisa mengubah rolenya sendiri
    if (id === adminUser.id) {
      return NextResponse.json(
        { message: 'Admin cannot change their own role.' },
        { status: 400 }
      );
    }

    const updatedUser = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
      });

    if (updatedUser.length === 0) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json(updatedUser[0], { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to update user role.' },
      { status: 500 }
    );
  }
}
