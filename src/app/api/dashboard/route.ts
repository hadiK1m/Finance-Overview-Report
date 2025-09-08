// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { balanceSheet, transactions, categories, items } from '@/lib/db/schema';
import { sql, sum, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rangeInDays = parseInt(searchParams.get('range') || '180', 10);
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - rangeInDays);

    // --- 1. Logika Kartu Saldo (Tidak Berubah) ---
    const allBalanceSheets = await db.select().from(balanceSheet);
    const balanceSheetsWithTotals = await Promise.all(
      allBalanceSheets.map(async (sheet) => {
        const incomeResult = await db
          .select({ total: sum(transactions.amount).mapWith(Number) })
          .from(transactions)
          .where(
            sql`${transactions.balanceSheetId} = ${sheet.id} AND ${transactions.amount} > 0`
          );
        const totalIncome = incomeResult[0]?.total || 0;
        const expenseResult = await db
          .select({ total: sum(transactions.amount).mapWith(Number) })
          .from(transactions)
          .where(
            sql`${transactions.balanceSheetId} = ${sheet.id} AND ${transactions.amount} < 0`
          );
        const totalExpense = expenseResult[0]?.total || 0;
        return { ...sheet, totalIncome, totalExpense };
      })
    );

    // --- 2. Logika Grafik Area (Tidak Berubah) ---
    const transactionHistory = await db
      .select({ date: transactions.date, amount: transactions.amount })
      .from(transactions)
      .where(sql`${transactions.date} >= ${dateLimit.toISOString()}`)
      .orderBy(transactions.date);

    // --- 3. Logika Pie Chart per Item dalam Kategori RKAP (Tidak Berubah) ---
    const itemExpensesByCategoryRaw = await db
      .select({
        categoryName: categories.name,
        budget: categories.budget,
        itemName: items.name,
        total: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .innerJoin(items, eq(transactions.itemId, items.id))
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        sql`${transactions.date} >= ${dateLimit.toISOString()} AND ${
          transactions.amount
        } < 0 AND ${categories.name} != 'Cash Advanced'`
      )
      .groupBy(categories.name, categories.budget, items.name)
      .orderBy(categories.name, sql`sum(${transactions.amount})`);

    const groupedByCategory: {
      [key: string]: {
        rkapName: string;
        budget: number;
        items: { name: string; value: number }[];
      };
    } = {};
    for (const row of itemExpensesByCategoryRaw) {
      if (!groupedByCategory[row.categoryName]) {
        groupedByCategory[row.categoryName] = {
          rkapName: row.categoryName,
          budget: row.budget,
          items: [],
        };
      }
      groupedByCategory[row.categoryName].items.push({
        name: row.itemName,
        value: Math.abs(row.total),
      });
    }
    const rkapItemExpenses = Object.values(groupedByCategory);

    // --- Mengembalikan semua data yang diperlukan ---
    return NextResponse.json({
      balanceSheets: balanceSheetsWithTotals,
      transactionHistory,
      // rkapBreakdown: formattedRkapBreakdown, // <-- LOGIKA INI DIHAPUS
      rkapItemExpenses: rkapItemExpenses,
    });
  } catch (error) {
    console.error('API GET Error (dashboard):', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard data.' },
      { status: 500 }
    );
  }
}
