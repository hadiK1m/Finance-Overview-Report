// src/app/api/drive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { driveItems, users } from '@/lib/db/schema';
import { decrypt } from '@/lib/auth';
import { eq, and, isNull, desc } from 'drizzle-orm';
import * as z from 'zod';
import { unlink } from 'fs/promises';
import { join } from 'path';

// Helper untuk mendapatkan sesi dan peran pengguna
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

const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.number().nullable().optional(),
});

const fileSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  path: z.string().min(1, 'File path is required'),
  size: z.number().min(0, 'File size is required'),
  parentId: z.number().nullable().optional(),
});

// Handler untuk mengambil item drive (file dan folder)
export async function GET(request: NextRequest) {
  const user = await getUserSession(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Tentukan kondisi filter di luar query
    const whereCondition =
      user.role === 'admin'
        ? undefined // Admin tidak memiliki filter, bisa melihat semua
        : eq(driveItems.userId, user.id); // User lain hanya bisa melihat miliknya

    const items = await db.query.driveItems.findMany({
      where: whereCondition,
      orderBy: (driveItems, { desc }) => [desc(driveItems.modifiedAt)],
    });
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch drive items.' },
      { status: 500 }
    );
  }
}

// Handler untuk membuat folder atau menyimpan metadata file
export async function POST(request: NextRequest) {
  const user = await getUserSession(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type } = body;

    if (type === 'folder') {
      const { name, parentId } = folderSchema.parse(body);
      const newFolder = await db
        .insert(driveItems)
        .values({
          name,
          type: 'folder',
          parentId,
          userId: user.id,
        })
        .returning();
      return NextResponse.json(newFolder[0], { status: 201 });
    }

    if (type === 'file') {
      const { name, path, size, parentId } = fileSchema.parse(body);
      const newFile = await db
        .insert(driveItems)
        .values({
          name,
          type: 'file',
          path,
          size,
          parentId,
          userId: user.id,
        })
        .returning();
      return NextResponse.json(newFile[0], { status: 201 });
    }

    return NextResponse.json(
      { message: 'Invalid item type.' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create drive item.' },
      { status: 500 }
    );
  }
}

// Handler untuk menghapus item
export async function DELETE(request: NextRequest) {
  const user = await getUserSession(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { message: 'Item ID is required.' },
        { status: 400 }
      );
    }

    const itemToDelete = await db.query.driveItems.findFirst({
      where: eq(driveItems.id, id),
    });

    if (!itemToDelete) {
      return NextResponse.json({ message: 'Item not found.' }, { status: 404 });
    }

    // Periksa hak akses: admin boleh hapus apa saja, user lain hanya miliknya
    if (user.role !== 'admin' && itemToDelete.userId !== user.id) {
      return NextResponse.json(
        {
          message: 'Forbidden: You do not have permission to delete this item.',
        },
        { status: 403 }
      );
    }

    if (itemToDelete.type === 'file' && itemToDelete.path) {
      try {
        const filePath = join(process.cwd(), 'public', itemToDelete.path);
        await unlink(filePath);
      } catch (fileError) {
        console.warn(
          `File not found or could not be deleted: ${itemToDelete.path}`
        );
      }
    }

    await db.delete(driveItems).where(eq(driveItems.id, id));

    return NextResponse.json(
      { message: 'Item deleted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('API DELETE Error (drive):', error);
    return NextResponse.json(
      { message: 'Failed to delete item.' },
      { status: 500 }
    );
  }
}
