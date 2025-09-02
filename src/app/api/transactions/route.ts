// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { apiTransactionSchema } from '@/lib/schemas';
import * as z from 'zod';
import { inArray } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { join } from 'path';

// Handler untuk GET (mengambil semua transaksi dengan relasinya)
export async function GET() {
  try {
    const allTransactions = await db.query.transactions.findMany({
      with: {
        category: { columns: { name: true } },
        item: { columns: { name: true } },
        balanceSheet: { columns: { name: true } },
      },
      orderBy: (transactions, { desc }) => [desc(transactions.date)],
    });
    return NextResponse.json(allTransactions, { status: 200 });
  } catch (error) {
    console.error('API GET Error (transactions):', error);
    return NextResponse.json(
      { message: 'Failed to fetch transactions.' },
      { status: 500 }
    );
  }
}

// Handler untuk POST (menambahkan transaksi baru)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedData = apiTransactionSchema.parse(body);

    const newTransaction = await db
      .insert(transactions)
      .values({
        date: parsedData.date,
        categoryId: Number(parsedData.rkapName),
        itemId: Number(parsedData.item),
        payee: parsedData.payee,
        amount: parsedData.amount,
        balanceSheetId: Number(parsedData.balanceSheetId),
        attachmentUrl: parsedData.attachmentUrl,
      })
      .returning();

    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation failed',
          errors: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    console.error('API POST Error (transactions):', error);
    return NextResponse.json(
      { message: 'Failed to create transaction.' },
      { status: 500 }
    );
  }
}

// Handler untuk DELETE (menghapus transaksi dan file terkait)
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

    const transactionsToDelete = await db.query.transactions.findMany({
      where: inArray(transactions.id, ids),
      columns: {
        attachmentUrl: true,
      },
    });

    for (const transaction of transactionsToDelete) {
      if (transaction.attachmentUrl) {
        try {
          const filePath = join(
            process.cwd(),
            'public',
            transaction.attachmentUrl
          );
          await unlink(filePath);
        } catch (fileError) {
          console.warn(
            `File not found or could not be deleted: ${transaction.attachmentUrl}`
          );
        }
      }
    }

    await db.delete(transactions).where(inArray(transactions.id, ids));

    return NextResponse.json(
      { message: 'Transactions deleted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('API DELETE Error (transactions):', error);
    return NextResponse.json(
      { message: 'Failed to delete transactions.' },
      { status: 500 }
    );
  }
}
