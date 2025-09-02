// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, balanceSheet } from '@/lib/db/schema';
import { apiTransactionSchema } from '@/lib/schemas';
import * as z from 'zod';
import { inArray, eq, sql } from 'drizzle-orm';
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
    const { amount, balanceSheetId, ...values } = parsedData;

    await db.transaction(async (tx) => {
      // 1. Masukkan transaksi baru
      await tx.insert(transactions).values({
        date: values.date,
        categoryId: Number(values.rkapName),
        itemId: Number(values.item),
        payee: values.payee,
        amount: amount,
        balanceSheetId: Number(balanceSheetId),
        attachmentUrl: values.attachmentUrl,
      });

      // 2. Perbarui saldo di balance_sheet
      await tx
        .update(balanceSheet)
        .set({ balance: sql`${balanceSheet.balance} + ${amount}` })
        .where(eq(balanceSheet.id, Number(balanceSheetId)));
    });

    return NextResponse.json(
      { message: 'Transaction created successfully' },
      { status: 201 }
    );
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
    });

    await db.transaction(async (tx) => {
      for (const transaction of transactionsToDelete) {
        // Kembalikan saldo (mengurangi amount akan menambahkan nilai jika negatif)
        if (transaction.balanceSheetId) {
          await tx
            .update(balanceSheet)
            .set({
              balance: sql`${balanceSheet.balance} - ${transaction.amount}`,
            })
            .where(eq(balanceSheet.id, transaction.balanceSheetId));
        }
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
      await tx.delete(transactions).where(inArray(transactions.id, ids));
    });

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

// Handler untuk PATCH (mengedit transaksi)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...valuesToUpdate } = apiTransactionSchema
      .extend({ id: z.number() })
      .parse(body);

    await db.transaction(async (tx) => {
      const originalTransaction = await tx.query.transactions.findFirst({
        where: eq(transactions.id, id),
      });

      if (!originalTransaction) {
        throw new Error('Transaction not found');
      }

      // Kembalikan saldo lama dari balance sheet yang lama
      if (originalTransaction.balanceSheetId) {
        await tx
          .update(balanceSheet)
          .set({
            balance: sql`${balanceSheet.balance} - ${originalTransaction.amount}`,
          })
          .where(eq(balanceSheet.id, originalTransaction.balanceSheetId));
      }

      // Tambahkan saldo baru ke balance sheet yang baru
      const newBalanceSheetId = Number(valuesToUpdate.balanceSheetId);
      await tx
        .update(balanceSheet)
        .set({
          balance: sql`${balanceSheet.balance} + ${valuesToUpdate.amount}`,
        })
        .where(eq(balanceSheet.id, newBalanceSheetId));

      // Perbarui data transaksi itu sendiri, termasuk attachmentUrl
      await tx
        .update(transactions)
        .set({
          date: valuesToUpdate.date,
          categoryId: Number(valuesToUpdate.rkapName),
          itemId: Number(valuesToUpdate.item),
          payee: valuesToUpdate.payee,
          amount: valuesToUpdate.amount,
          balanceSheetId: newBalanceSheetId,
          attachmentUrl: valuesToUpdate.attachmentUrl,
        })
        .where(eq(transactions.id, id));
    });

    return NextResponse.json(
      { message: 'Transaction updated successfully.' },
      { status: 200 }
    );
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
    console.error('API PATCH Error (transactions):', error);
    return NextResponse.json(
      { message: 'Failed to update transaction.' },
      { status: 500 }
    );
  }
}
