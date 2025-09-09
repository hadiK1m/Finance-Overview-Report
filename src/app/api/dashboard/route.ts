// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { balanceSheet, transactions, categories, items } from '@/lib/db/schema';
import { sql, sum, eq, lt, gte, lte, and, asc, ne, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rangeInDays = parseInt(searchParams.get('range') || '180', 10);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - rangeInDays);

    // --- 1. Logika Kartu Saldo (KEMBALI MENGHITUNG "Cash Advanced") ---
    const allBalanceSheets = await db.select().from(balanceSheet);
    const balanceSheetsWithTotals = await Promise.all(
      allBalanceSheets.map(async (sheet) => {
        // Pemasukan (termasuk semua kategori)
        const incomeResult = await db
          .select({ total: sum(transactions.amount).mapWith(Number) })
          .from(transactions)
          .where(
            and(
              eq(transactions.balanceSheetId, sheet.id),
              gte(transactions.amount, 0),
              gte(transactions.date, startDate)
            )
          );
        const totalIncome = incomeResult[0]?.total || 0;

        // Pengeluaran (termasuk semua kategori)
        const expenseResult = await db
          .select({ total: sum(transactions.amount).mapWith(Number) })
          .from(transactions)
          .where(
            and(
              eq(transactions.balanceSheetId, sheet.id),
              lt(transactions.amount, 0),
              gte(transactions.date, startDate)
            )
          );
        const totalExpense = expenseResult[0]?.total || 0;

        // CurrentBalance diambil langsung dari database
        return { ...sheet, totalIncome, totalExpense };
      })
    );

    // --- 2. Logika Grafik ---
    // a. Daily transaction history (untuk grafik harian, termasuk semua transaksi)
    const dailyTransactionHistory = await db
      .select({ date: transactions.date, amount: transactions.amount })
      .from(transactions)
      .where(
        and(gte(transactions.date, startDate), lte(transactions.date, endDate))
      )
      .orderBy(asc(transactions.date));

    // b. Overall Transactions Overview (transaksi harian TANPA "Cash Advanced")
    // Include Cash Advanced only for income (amount >= 0), exclude it for expenses
    const overallTransactionHistory = await db
      .select({ date: transactions.date, amount: transactions.amount })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
          // allow Cash Advanced when amount >= 0, otherwise exclude Cash Advanced expenses
          or(ne(categories.name, 'Cash Advanced'), gte(transactions.amount, 0))
        )
      )
      .orderBy(asc(transactions.date));

    // --- 3. Logika Pie Chart per Item dalam Kategori RKAP ---
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
        and(
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
          lt(transactions.amount, 0),
          ne(categories.name, 'Cash Advanced')
        )
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
      transactionHistory: dailyTransactionHistory,
      overallTransactionHistory: overallTransactionHistory,
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
