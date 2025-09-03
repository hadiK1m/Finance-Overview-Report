// src/app/api/transactions/import/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, categories, items, balanceSheet } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const importData = body.data;

    if (!Array.isArray(importData) || importData.length === 0) {
      return NextResponse.json(
        { message: 'No data to import.' },
        { status: 400 }
      );
    }

    // Ambil semua data master untuk lookup
    const allCategories = await db.select().from(categories);
    const allItems = await db.select().from(items);
    const allBalanceSheets = await db.select().from(balanceSheet);

    // Buat map untuk lookup ID yang efisien (case-insensitive)
    const categoryMap = new Map(
      allCategories.map((c) => [c.name.toLowerCase(), c.id])
    );
    const itemMap = new Map(allItems.map((i) => [i.name.toLowerCase(), i.id]));
    const balanceSheetMap = new Map(
      allBalanceSheets.map((b) => [b.name.toLowerCase(), b.id])
    );

    await db.transaction(async (tx) => {
      for (const row of importData) {
        // Validasi dan lookup ID
        const categoryId = categoryMap.get(row.rkapName?.toLowerCase());
        const itemId = itemMap.get(row.itemName?.toLowerCase());
        const balanceSheetId = balanceSheetMap.get(
          row.balanceSheetName?.toLowerCase()
        );
        const amount = Number(row.amount);

        // Lewati baris yang datanya tidak lengkap atau tidak valid
        if (
          !categoryId ||
          !itemId ||
          !balanceSheetId ||
          isNaN(amount) ||
          !row.date ||
          !row.payee
        ) {
          console.warn('Skipping invalid CSV row:', row);
          continue;
        }

        // 1. Masukkan transaksi baru
        await tx.insert(transactions).values({
          date: new Date(row.date),
          categoryId,
          itemId,
          payee: row.payee,
          amount,
          balanceSheetId,
        });

        // 2. Perbarui saldo di balance_sheet terkait
        await tx
          .update(balanceSheet)
          .set({ balance: sql`${balanceSheet.balance} + ${amount}` })
          .where(eq(balanceSheet.id, balanceSheetId));
      }
    });

    return NextResponse.json(
      { message: 'Data imported successfully.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('API Import Error:', error);
    return NextResponse.json(
      { message: 'An unexpected server error occurred during import.' },
      { status: 500 }
    );
  }
}
