// src/app/api/items/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { items, categories } from '@/lib/db/schema';
import * as z from 'zod';
import { eq, inArray } from 'drizzle-orm'; // <-- Impor 'inArray'

const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required.'),
  categoryId: z.coerce.number().min(1, 'Category is required.'),
});

const updateItemSchema = itemSchema.extend({
  id: z.number(),
});

// Handler GET
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
      orderBy: (items, { desc }) => [desc(items.id)],
    });
    return NextResponse.json(allItems, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch items.' },
      { status: 500 }
    );
  }
}

// Handler POST
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

// Handler PATCH
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, categoryId } = updateItemSchema.parse(body);

    const updatedItem = await db
      .update(items)
      .set({ name, categoryId })
      .where(eq(items.id, id))
      .returning();

    if (updatedItem.length === 0) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(updatedItem[0], { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to update item' },
      { status: 500 }
    );
  }
}

// === TAMBAHKAN HANDLER DELETE BARU INI ===
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = z.object({ ids: z.array(z.number()) }).parse(body);

    if (ids.length === 0) {
      return NextResponse.json(
        { message: 'No IDs provided for deletion.' },
        { status: 400 }
      );
    }

    await db.delete(items).where(inArray(items.id, ids));

    return NextResponse.json(
      { message: 'Items deleted successfully.' },
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
      { message: 'Failed to delete items.' },
      { status: 500 }
    );
  }
}
