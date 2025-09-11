// src/app/api/report/by-item/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, items, users } from '@/lib/db/schema';
import { sql, and, gte, lte, eq, lt, inArray, desc } from 'drizzle-orm';
import * as xlsx from 'xlsx-js-style';
import { format, getMonth, getYear } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';
import { decrypt } from '@/lib/auth';

// Helper untuk mendapatkan sesi pengguna (opsional, tapi bagus untuk keamanan)
async function getUserSession(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) return null;
  const session = await decrypt(token);
  if (!session?.userId) return null;
  return db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { id: true, role: true },
  });
}

// Fungsi helper untuk mendapatkan bulan dalam rentang
const getMonthsInRange = (startDate: Date, endDate: Date): Date[] => {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const months: Date[] = [];
  let current = start;
  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
};

export async function POST(request: NextRequest) {
  const user = await getUserSession(request);
  if (user?.role !== 'admin' && user?.role !== 'assistant_admin') {
    return NextResponse.json(
      { message: 'Forbidden: You do not have permission to export reports.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { itemIds, startDate, endDate } = body;

    if (
      !itemIds ||
      !Array.isArray(itemIds) ||
      itemIds.length === 0 ||
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        { message: 'Item IDs and date range are required.' },
        { status: 400 }
      );
    }

    const reportYear = getYear(new Date(startDate));

    // Ambil semua transaksi pengeluaran untuk item yang dipilih dalam rentang tanggal
    const relevantTransactions = await db
      .select({
        itemId: transactions.itemId,
        amount: transactions.amount,
        date: transactions.date,
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.date, new Date(startDate)),
          lte(transactions.date, new Date(endDate)),
          lt(transactions.amount, 0), // Hanya pengeluaran
          inArray(transactions.itemId, itemIds) // Filter berdasarkan item yang dipilih
        )
      );

    if (relevantTransactions.length === 0) {
      return NextResponse.json(
        { message: 'No expense data to export for the selected items.' },
        { status: 404 }
      );
    }

    // Ambil detail item yang dipilih
    const selectedItems = await db
      .select({ id: items.id, name: items.name })
      .from(items)
      .where(inArray(items.id, itemIds))
      .orderBy(desc(items.id));

    const itemMap = new Map(selectedItems.map((i) => [i.id, i.name]));
    const monthsInRange = getMonthsInRange(
      new Date(startDate),
      new Date(endDate)
    );
    const monthHeaders = monthsInRange.map((d) =>
      format(d, 'MMMM', { locale: indonesiaLocale }).toUpperCase()
    );

    const reportData: { [key: string]: any } = {};

    // Inisialisasi reportData berdasarkan item yang dipilih
    for (const item of selectedItems) {
      reportData[item.name] = { URAIAN: item.name };
      monthHeaders.forEach((header) => {
        reportData[item.name][header] = 0;
      });
    }

    // Agregasi data transaksi
    relevantTransactions.forEach((tx) => {
      const itemName = itemMap.get(tx.itemId);
      if (itemName) {
        const monthName = format(new Date(tx.date), 'MMMM', {
          locale: indonesiaLocale,
        }).toUpperCase();
        if (
          reportData[itemName] &&
          reportData[itemName][monthName] !== undefined
        ) {
          reportData[itemName][monthName] += Math.abs(tx.amount);
        }
      }
    });

    const wb = xlsx.utils.book_new();
    const wsData: any[][] = [];

    // Styling (Sama seperti report sebelumnya)
    const fontArial = { name: 'Arial', sz: 11 };
    const borderAll = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
    const styleTitle = {
      font: { ...fontArial, sz: 12, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
    const styleSubtitle = {
      font: fontArial,
      alignment: { horizontal: 'center', vertical: 'center' },
    };
    const styleHeader = {
      font: { ...fontArial, bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: borderAll,
    };
    const styleDataText = {
      font: fontArial,
      border: borderAll,
      alignment: { vertical: 'top', wrapText: true },
    };
    const styleCurrency = {
      ...styleDataText,
      numFmt: '_(* #,##0_);_(* (#,##0);_(* "-"??_);_(@_)',
    };

    // Header
    wsData.push(['DEWAN KOMISARIS PT PLN (PERSERO)']);
    wsData.push(['LAPORAN PENGELUARAN BERDASARKAN ITEM']);
    wsData.push([
      `Untuk Periode ${format(new Date(startDate), 'd MMMM', {
        locale: indonesiaLocale,
      })} s.d. ${format(new Date(endDate), 'd MMMM yyyy', {
        locale: indonesiaLocale,
      })}`,
    ]);
    wsData.push([]);

    // Logic untuk header dinamis berdasarkan kuartal (sama seperti sebelumnya)
    const headerRow1: (string | null)[] = ['URAIAN'];
    const headerRow2: (string | null)[] = [null];
    const headerRow3: (string | null)[] = ['1'];

    const quarters: { [key: number]: string[] } = {
      1: [],
      2: [],
      3: [],
      4: [],
    };
    monthsInRange.forEach((date) => {
      const monthIndex = getMonth(date);
      const quarter = Math.floor(monthIndex / 3) + 1;
      const monthName = format(date, 'MMMM', {
        locale: indonesiaLocale,
      }).toUpperCase();
      if (!quarters[quarter].includes(monthName)) {
        quarters[quarter].push(monthName);
      }
    });

    let columnCounter = 1;
    let totalColCount = 1;
    Object.keys(quarters).forEach((q) => {
      const quarterMonths = quarters[Number(q)];
      if (quarterMonths.length > 0) {
        headerRow1.push(`REALISASI TRIWULAN ${q}`);
        headerRow1.push(...Array(quarterMonths.length).fill(null));
        quarterMonths.forEach((month) => {
          headerRow2.push(month);
          headerRow3.push(String(++columnCounter));
        });
        headerRow2.push('JUMLAH');
        headerRow3.push(String(++columnCounter));
        totalColCount += quarterMonths.length + 1;
      }
    });

    headerRow1.push('TOTAL');
    headerRow2.push(null);
    headerRow3.push(String(++columnCounter));
    totalColCount += 1;

    wsData.push(headerRow1, headerRow2, headerRow3);

    // Data rows
    Object.values(reportData).forEach((row) => {
      const dataRow: (string | number | null)[] = [row['URAIAN']];
      let total = 0;
      Object.keys(quarters).forEach((q) => {
        const quarterMonths = quarters[Number(q)];
        if (quarterMonths.length > 0) {
          let quarterTotal = 0;
          quarterMonths.forEach((monthName) => {
            const amount = row[monthName] || 0;
            dataRow.push(amount);
            quarterTotal += amount;
          });
          dataRow.push(quarterTotal);
          total += quarterTotal;
        }
      });
      dataRow.push(total);
      wsData.push(dataRow);
    });

    const ws = xlsx.utils.aoa_to_sheet(wsData);

    // Merging cells (disesuaikan karena tidak ada kolom anggaran)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalColCount - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalColCount - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: totalColCount - 1 } },
      { s: { r: 4, c: 0 }, e: { r: 6, c: 0 } },
    ];
    let currentCol = 1;
    Object.keys(quarters).forEach((q) => {
      const quarterMonths = quarters[Number(q)];
      if (quarterMonths.length > 0) {
        ws['!merges']!.push({
          s: { r: 4, c: currentCol },
          e: { r: 4, c: currentCol + quarterMonths.length },
        });
        currentCol += quarterMonths.length + 1;
      }
    });
    ws['!merges'].push({
      s: { r: 4, c: currentCol },
      e: { r: 6, c: currentCol },
    });

    // Apply styles
    ws['A1'].s = styleTitle;
    ws['A2'].s = styleTitle;
    ws['A3'].s = styleSubtitle;
    for (let c = 0; c < totalColCount; c++) {
      for (let r = 4; r <= 6; r++) {
        const cellRef = xlsx.utils.encode_cell({ r, c });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
        ws[cellRef].s = styleHeader;
      }
    }
    for (let R = 7; R < wsData.length; R++) {
      ws[xlsx.utils.encode_cell({ r: R, c: 0 })].s = styleDataText;
      for (let C = 1; C < totalColCount; C++) {
        const cellRef = xlsx.utils.encode_cell({ r: R, c: C });
        if (ws[cellRef]) ws[cellRef].s = styleCurrency;
      }
    }

    ws['!cols'] = [{ wch: 35 }, ...Array(totalColCount - 1).fill({ wch: 15 })];

    xlsx.utils.book_append_sheet(wb, ws, 'Laporan per Item');
    const buffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="Laporan_per_Item.xlsx"`,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('API Report by Item Error:', error);
    return NextResponse.json(
      { message: 'Failed to generate report.' },
      { status: 500 }
    );
  }
}
