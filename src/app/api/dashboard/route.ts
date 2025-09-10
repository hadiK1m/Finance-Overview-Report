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

    // Pastikan urutan balance sheets: Bank dulu, lalu Petty Cash, sisanya mengikuti urutan asli
    // gunakan perbandingan case-insensitive dan kemudian deduplikasi (id+name)
    const orderedBalanceSheets = (() => {
      const lower = (v: any) => String(v ?? '').toLowerCase();
      const bank =
        balanceSheetsWithTotals.find((s) => lower(s.name) === 'bank') ?? null;
      const petty =
        balanceSheetsWithTotals.find((s) => lower(s.name) === 'petty cash') ??
        null;
      const others = balanceSheetsWithTotals.filter(
        (s) => lower(s.name) !== 'bank' && lower(s.name) !== 'petty cash'
      );
      const result: typeof balanceSheetsWithTotals = [];
      if (bank) result.push(bank);
      if (petty) result.push(petty);
      result.push(...others);

      // dedupe berdasarkan id+name, pertahankan urutan; juga tambahkan uid unik untuk keperluan UI
      const seen = new Map<string, any>();
      const deduped: any[] = [];
      for (const s of result) {
        const key = `${s.id}-${String(s.name).toLowerCase()}`;
        if (!seen.has(key)) {
          seen.set(key, true);
          // tambah uid untuk memastikan frontend bisa memakai key unik tanpa memodifikasi id primer
          deduped.push({
            ...s,
            uid: `${s.id}-${String(s.name).replace(/\s+/g, '-').toLowerCase()}`,
          });
        }
      }
      return deduped;
    })();

    // --- 2. Logika Grafik ---
    // a. Daily transaction history (agg per day, termasuk semua transaksi)
    // group by calendar date to avoid splitting by time component
    const dailyTransactionHistory = await db
      .select({
        date: sql`date(${transactions.date})`,
        amount: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .where(
        and(gte(transactions.date, startDate), lte(transactions.date, endDate))
      )
      .groupBy(sql`date(${transactions.date})`)
      .orderBy(asc(sql`date(${transactions.date})`));

    // b. Overall Transactions Overview (agg per day)
    // Include Cash Advanced transactions when amount >= 0 (income),
    // exclude Cash Advanced expenses (amount < 0)
    const overallTransactionHistory = await db
      .select({
        date: sql`date(${transactions.date})`,
        amount: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
          or(ne(categories.name, 'Cash Advanced'), gte(transactions.amount, 0))
        )
      )
      .groupBy(sql`date(${transactions.date})`)
      .orderBy(asc(sql`date(${transactions.date})`));

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
      // balanceSheets sekarang sudah deduplikasi dan punya field `uid` unik per entry
      balanceSheets: orderedBalanceSheets,
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
