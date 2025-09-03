// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { balanceSheet, transactions } from '@/lib/db/schema';
import { sql, sum, eq, gt, lt } from 'drizzle-orm';

export async function GET() {
  try {
    // 1. Ambil semua data Balance Sheet
    const allBalanceSheets = await db.select().from(balanceSheet);

    // 2. Untuk setiap Balance Sheet, hitung total income dan expense
    const balanceSheetsWithTotals = await Promise.all(
      allBalanceSheets.map(async (sheet) => {
        // Hitung total pemasukan (amount > 0)
        const incomeResult = await db
          .select({
            total: sum(transactions.amount).mapWith(Number),
          })
          .from(transactions)
          .where(
            sql`${transactions.balanceSheetId} = ${sheet.id} AND ${transactions.amount} > 0`
          );
        const totalIncome = incomeResult[0]?.total || 0;

        // Hitung total pengeluaran (amount < 0)
        const expenseResult = await db
          .select({
            total: sum(transactions.amount).mapWith(Number),
          })
          .from(transactions)
          .where(
            sql`${transactions.balanceSheetId} = ${sheet.id} AND ${transactions.amount} < 0`
          );
        const totalExpense = expenseResult[0]?.total || 0;

        return {
          ...sheet,
          totalIncome,
          totalExpense,
        };
      })
    );

    // 3. Ambil data transaksi untuk grafik (logika ini tetap sama)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const transactionHistory = await db
      .select({
        date: transactions.date,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(sql`${transactions.date} >= ${thirtyDaysAgo.toISOString()}`)
      .orderBy(transactions.date);

    return NextResponse.json({
      balanceSheets: balanceSheetsWithTotals,
      transactionHistory,
    });
  } catch (error) {
    console.error('API GET Error (dashboard):', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard data.' },
      { status: 500 }
    );
  }
}
