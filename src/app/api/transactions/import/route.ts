// src/app/api/transactions/import/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, items, balanceSheet } from '@/lib/db/schema';
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

    const allItems = await db.select().from(items);
    const allBalanceSheets = await db.select().from(balanceSheet);

    const itemInfoMap = new Map(
      allItems.map((i) => [
        i.name.toLowerCase(),
        { id: i.id, categoryId: i.categoryId },
      ])
    );
    const balanceSheetMap = new Map(
      allBalanceSheets.map((b) => [b.name.toLowerCase(), b.id])
    );

    let successCount = 0;
    // === PERUBAHAN: DARI skippedCount MENJADI ARRAY UNTUK MENYIMPAN DETAIL ===
    const skippedRows: { row: any; reason: string }[] = [];

    await db.transaction(async (tx) => {
      for (const [index, row] of importData.entries()) {
        const itemInfo = itemInfoMap.get(row.itemName?.toLowerCase());
        const itemId = itemInfo?.id;
        const categoryId = itemInfo?.categoryId;
        const balanceSheetId = balanceSheetMap.get(
          row.balanceSheetName?.toLowerCase()
        );
        const amount = Number(row.amount);

        // === PERUBAHAN: Logika validasi dengan pesan error yang spesifik ===
        let validationError: string | null = null;
        if (!row.date) validationError = 'Date is missing.';
        else if (!row.payee) validationError = 'Payee is missing.';
        else if (!row.itemName) validationError = 'Item Name is missing.';
        else if (!itemInfo)
          validationError = `Item "${row.itemName}" not found.`;
        else if (!row.balanceSheetName)
          validationError = 'Balance Sheet Name is missing.';
        else if (!balanceSheetId)
          validationError = `Balance Sheet "${row.balanceSheetName}" not found.`;
        else if (isNaN(amount))
          validationError = 'Amount is not a valid number.';

        if (validationError) {
          skippedRows.push({
            row: { ...row, lineNumber: index + 2 },
            reason: validationError,
          });
          continue;
        }

        await tx.insert(transactions).values({
          date: new Date(row.date),
          categoryId: categoryId!,
          itemId: itemId!,
          payee: row.payee,
          amount,
          balanceSheetId: balanceSheetId!,
        });

        await tx
          .update(balanceSheet)
          .set({ balance: sql`${balanceSheet.balance} + ${amount}` })
          .where(eq(balanceSheet.id, balanceSheetId!));

        successCount++;
      }
    });

    return NextResponse.json(
      {
        message: 'Import process completed.',
        successCount,
        skippedRows, // Mengirim kembali detail baris yang dilewati
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Import Error:', error);
    return NextResponse.json(
      { message: 'An unexpected server error occurred during import.' },
      { status: 500 }
    );
  }
}
