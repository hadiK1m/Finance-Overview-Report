// src/app/api/items/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items, categories } from '@/lib/db/schema';
import * as z from 'zod';

const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required.'),
  categoryId: z.coerce.number().min(1, 'Category is required.'),
});

// Mengambil semua item beserta kategori terkait
export async function GET() {
  try {
    const allItems = await db.query.items.findMany({
      with: {
        category: {
          columns: {
            name: true,
          },
        },
      },
    });
    return NextResponse.json(allItems, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch items.' },
      { status: 500 }
    );
  }
}

// Menambahkan item baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, categoryId } = itemSchema.parse(body);

    const newItem = await db
      .insert(items)
      .values({ name, categoryId })
      .returning();
    return NextResponse.json(newItem[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create item.' },
      { status: 500 }
    );
  }
}
