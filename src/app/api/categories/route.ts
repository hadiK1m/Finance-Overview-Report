// src/app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories, items } from '@/lib/db/schema'; // Impor 'items'
import * as z from 'zod';
import { inArray, eq, sql } from 'drizzle-orm'; // Impor 'inArray' dan 'eq', 'sql'
import { getTableColumns } from 'drizzle-orm';

// Skema untuk validasi data kategori baru
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required.'),
  budget: z.coerce.number().min(0, 'Budget must be a positive number.'),
});

// Handler untuk GET (mengambil semua kategori beserta jumlah item)
export async function GET() {
  try {
    const allCategories = await db
      .select({
        ...getTableColumns(categories),
        itemCount: sql<number>`count(${items.id})`.mapWith(Number),
      })
      .from(categories)
      .leftJoin(items, eq(categories.id, items.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.id);

    return NextResponse.json(allCategories, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch categories with count:', error);
    return NextResponse.json(
      { message: 'Failed to fetch categories.' },
      { status: 500 }
    );
  }
}

// Handler untuk POST (menambahkan kategori baru)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, budget } = categorySchema.parse(body);

    const newCategory = await db
      .insert(categories)
      .values({ name, budget })
      .returning();

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create category.' },
      { status: 500 }
    );
  }
}

// Handler untuk DELETE (menghapus kategori)
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = z.object({ ids: z.array(z.number()) }).parse(body);

    if (ids.length === 0) {
      return NextResponse.json(
        { message: 'No IDs provided.' },
        { status: 400 }
      );
    }

    await db.delete(categories).where(inArray(categories.id, ids));

    return NextResponse.json(
      { message: 'Categories deleted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to delete categories.' },
      { status: 500 }
    );
  }
}
