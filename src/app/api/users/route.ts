// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userRoleEnum } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import * as z from 'zod';
import { decrypt } from '@/lib/auth';

// Helper untuk mendapatkan sesi pengguna
async function getUserSession(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) return null;

  const session = await decrypt(token);
  if (!session?.userId) return null;

  return await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { id: true, role: true },
  });
}

const updateUserRoleSchema = z.object({
  id: z.number(),
  role: z.enum(userRoleEnum.enumValues),
});

// Handler untuk GET (mengambil semua pengguna)
export async function GET() {
  try {
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

// Handler untuk PATCH (mengubah peran pengguna)
export async function PATCH(request: NextRequest) {
  const adminUser = await getUserSession(request);
  if (adminUser?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden: Admins only.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, role } = updateUserRoleSchema.parse(body);

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
    console.error('API PATCH Error (users):', error);
    return NextResponse.json(
      { message: 'Failed to update user role.' },
      { status: 500 }
    );
  }
}

// Handler untuk DELETE (menghapus pengguna)
export async function DELETE(request: NextRequest) {
  const adminUser = await getUserSession(request);
  if (adminUser?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden: Admins only.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id: userIdToDelete } = z.object({ id: z.number() }).parse(body);

    if (userIdToDelete === adminUser.id) {
      return NextResponse.json(
        { message: 'Admin cannot delete their own account.' },
        { status: 400 }
      );
    }

    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, userIdToDelete))
      .returning();

    if (deletedUser.length === 0) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'User deleted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('API DELETE Error (users):', error);
    return NextResponse.json(
      { message: 'Failed to delete user.' },
      { status: 500 }
    );
  }
}
