// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, balanceSheet, users } from '@/lib/db/schema';
import { apiTransactionSchema } from '@/lib/schemas';
import * as z from 'zod';
import { inArray, eq, sql, desc } from 'drizzle-orm'; // <-- Impor 'desc'
import { unlink } from 'fs/promises';
import { join } from 'path';
import { decrypt } from '@/lib/auth';

// Helper untuk mendapatkan sesi dan peran pengguna
async function getUserSession(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) return null;

  const session = await decrypt(token);
  if (!session?.userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { id: true, role: true },
  });

  return user;
}

// Handler untuk GET (mengambil semua transaksi dengan relasinya)
export async function GET(request: NextRequest) {
  // Tambahkan NextRequest
  // === LOGIKA BARU UNTUK FILTER DATA BERBASIS PERAN ===
  const user = await getUserSession(request);

  try {
    let query = db
      .select({
        // Pilih semua kolom yang diperlukan
        id: transactions.id,
        date: transactions.date,
        payee: transactions.payee,
        amount: transactions.amount,
        attachmentUrl: transactions.attachmentUrl,
        createdAt: transactions.createdAt,
        categoryId: transactions.categoryId,
        itemId: transactions.itemId,
        balanceSheetId: transactions.balanceSheetId,
        // Sertakan data relasi
        category: { name: categories.name },
        item: { name: items.name },
        balanceSheet: { name: balanceSheet.name },
      })
      .from(transactions)
      .leftJoin(items, eq(transactions.itemId, items.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(balanceSheet, eq(transactions.balanceSheetId, balanceSheet.id))
      .orderBy(desc(transactions.date));

    // Jika pengguna adalah assistant_admin, tambahkan filter WHERE
    if (user?.role === 'assistant_admin') {
      // @ts-ignore
      query.where(eq(transactions.userId, user.id));
    }

    const result = await query;

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('API GET Error (transactions):', error);
    return NextResponse.json(
      { message: 'Failed to fetch transactions.' },
      { status: 500 }
    );
  }
}

// ... (Handler POST, PATCH, DELETE, PUT tidak ada perubahan signifikan dan sudah aman) ...

// Handler untuk POST (menambahkan transaksi baru)
export async function POST(request: NextRequest) {
  const user = await getUserSession(request);
  if (user?.role !== 'admin' && user?.role !== 'assistant_admin') {
    return NextResponse.json(
      {
        message:
          'Forbidden: You do not have permission to create transactions.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsedData = apiTransactionSchema.parse(body);
    const { amount, balanceSheetId, ...values } = parsedData;

    await db.transaction(async (tx) => {
      await tx.insert(transactions).values({
        date: values.date,
        categoryId: Number(values.rkapName),
        itemId: Number(values.item),
        payee: values.payee,
        amount: amount,
        balanceSheetId: Number(balanceSheetId),
        attachmentUrl: values.attachmentUrl,
        userId: user.id, // Catat siapa yang membuat transaksi
      });

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
export async function DELETE(request: NextRequest) {
  const user = await getUserSession(request);
  if (user?.role !== 'admin' && user?.role !== 'assistant_admin') {
    return NextResponse.json(
      {
        message:
          'Forbidden: You do not have permission to delete transactions.',
      },
      { status: 403 }
    );
  }

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

    // Logika tambahan untuk assistant_admin
    if (user.role === 'assistant_admin') {
      for (const tx of transactionsToDelete) {
        if (tx.userId !== user.id) {
          return NextResponse.json(
            {
              message: 'Forbidden: You can only delete your own transactions.',
            },
            { status: 403 }
          );
        }
      }
    }

    await db.transaction(async (tx) => {
      for (const transaction of transactionsToDelete) {
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
export async function PATCH(request: NextRequest) {
  const user = await getUserSession(request);
  if (user?.role !== 'admin' && user?.role !== 'assistant_admin') {
    return NextResponse.json(
      {
        message: 'Forbidden: You do not have permission to edit transactions.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, ...valuesToUpdate } = apiTransactionSchema
      .extend({ id: z.number() })
      .parse(body);

    const originalTransaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
    });

    if (!originalTransaction) {
      throw new Error('Transaction not found');
    }

    // Logika tambahan untuk assistant_admin
    if (
      user.role === 'assistant_admin' &&
      originalTransaction.userId !== user.id
    ) {
      return NextResponse.json(
        { message: 'Forbidden: You can only edit your own transactions.' },
        { status: 403 }
      );
    }

    await db.transaction(async (tx) => {
      if (originalTransaction.balanceSheetId) {
        await tx
          .update(balanceSheet)
          .set({
            balance: sql`${balanceSheet.balance} - ${originalTransaction.amount}`,
          })
          .where(eq(balanceSheet.id, originalTransaction.balanceSheetId));
      }

      const newBalanceSheetId = Number(valuesToUpdate.balanceSheetId);
      await tx
        .update(balanceSheet)
        .set({
          balance: sql`${balanceSheet.balance} + ${valuesToUpdate.amount}`,
        })
        .where(eq(balanceSheet.id, newBalanceSheetId));

      await tx
        .update(transactions)
        .set({
          date: valuesToUpdate.date,
          categoryId: Number(valuesToUpdate.rkapName),
          itemId: Number(valuesToUpdate.item),
          payee: valuesToUpdate.payee,
          amount: valuesToUpdate.amount,
          balanceSheetId: newBalanceSheetId,
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

// Handler untuk PUT (mengedit attachment)
export async function PUT(request: NextRequest) {
  const user = await getUserSession(request);
  if (user?.role !== 'admin' && user?.role !== 'assistant_admin') {
    return NextResponse.json(
      {
        message: 'Forbidden: You do not have permission to upload attachments.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, attachmentUrl } = z
      .object({
        id: z.number(),
        attachmentUrl: z.string().optional().nullable(),
      })
      .parse(body);

    // Anda mungkin ingin menambahkan cek kepemilikan di sini untuk assistant_admin

    const updatedTransaction = await db
      .update(transactions)
      .set({ attachmentUrl: attachmentUrl || null })
      .where(eq(transactions.id, id))
      .returning();

    if (updatedTransaction.length === 0) {
      return NextResponse.json(
        { message: 'Transaction not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTransaction[0], { status: 200 });
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
    console.error('API PUT Error (transactions):', error);
    return NextResponse.json(
      { message: 'Failed to update attachment.' },
      { status: 500 }
    );
  }
}
