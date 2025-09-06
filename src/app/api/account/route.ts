// src/app/api/account/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as z from 'zod';
import { decrypt } from '@/lib/auth';

// === PERBAIKAN UTAMA ADA DI SKEMA INI ===
const profileSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters.'),
  // Hapus .url() dan cukup periksa apakah ini string, null, atau opsional
  avatarUrl: z.string().nullable().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
});

async function getSession(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) return null;
  return await decrypt(token);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });

  if (!currentUser) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const body = await request.json();
  const updateType = body.type;

  try {
    if (updateType === 'profile') {
      const { fullName, avatarUrl } = profileSchema.parse(body);
      await db
        .update(users)
        .set({ fullName, avatarUrl })
        .where(eq(users.id, session.userId));
      return NextResponse.json(
        { message: 'Profile updated successfully.' },
        { status: 200 }
      );
    }

    if (updateType === 'password') {
      const { currentPassword, newPassword } = passwordSchema.parse(body);

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        currentUser.password
      );
      if (!isPasswordValid) {
        return NextResponse.json(
          { message: 'Incorrect current password.' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, session.userId));
      return NextResponse.json(
        { message: 'Password updated successfully.' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: 'Invalid update type.' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('API Account PATCH Error:', error);
    return NextResponse.json(
      { message: 'Failed to update account.' },
      { status: 500 }
    );
  }
}
