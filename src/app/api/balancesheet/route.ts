// src/app/api/balancesheet/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { balanceSheet } from '@/lib/db/schema';
import * as z from 'zod';
import { inArray } from 'drizzle-orm';

const sheetSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  balance: z.coerce.number(),
});

export async function GET() {
  try {
    const allSheets = await db.select().from(balanceSheet);
    return NextResponse.json(allSheets, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch balance sheets.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, balance } = sheetSchema.parse(body);

    const newSheet = await db
      .insert(balanceSheet)
      .values({ name, balance })
      .returning();
    return NextResponse.json(newSheet[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create balance sheet.' },
      { status: 500 }
    );
  }
}

// FUNGSI DELETE
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

    await db.delete(balanceSheet).where(inArray(balanceSheet.id, ids));

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
