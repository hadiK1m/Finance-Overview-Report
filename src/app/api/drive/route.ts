// src/app/api/drive/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { driveItems } from '@/lib/db/schema';
import { decrypt } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import * as z from 'zod';
import { unlink } from 'fs/promises';
import { join } from 'path';

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

// Handler untuk mengambil semua item drive (file dan folder)
export async function GET(request: Request) {
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

  try {
    const items = await db.query.driveItems.findMany({
      where: eq(driveItems.userId, session.userId),
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
export async function POST(request: Request) {
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
          userId: session.userId,
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
          userId: session.userId,
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

export async function DELETE(request: Request) {
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

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { message: 'Item ID is required.' },
        { status: 400 }
      );
    }

    // Cari item yang akan dihapus
    const itemToDelete = await db.query.driveItems.findFirst({
      where: and(eq(driveItems.id, id), eq(driveItems.userId, session.userId)),
    });

    if (!itemToDelete) {
      return NextResponse.json(
        { message: 'Item not found or you do not have permission.' },
        { status: 404 }
      );
    }

    // Jika ini adalah file, hapus juga file fisiknya
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

    // Hapus item dari database (cascade akan menghapus children jika ini folder)
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
