// src/app/api/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, items, categories, users } from '@/lib/db/schema';
import { sql, and, gte, lte, eq, lt } from 'drizzle-orm';
import * as xlsx from 'xlsx-js-style';
import { format, getMonth, getYear } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';
import { decrypt } from '@/lib/auth';

// Helper untuk mendapatkan sesi dan peran pengguna
async function getUserSession(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) return null;

  const session = await decrypt(token);
  if (!session?.userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { role: true },
  });

  return user;
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
  // --- 1. Tambahkan Pemeriksaan Otorisasi ---
  const user = await getUserSession(request);
  if (user?.role !== 'admin' && user?.role !== 'assistant_admin') {
    return NextResponse.json(
      { message: 'Forbidden: You do not have permission to export reports.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { startDate, endDate } = body;
    const reportYear = getYear(new Date(startDate));
    const anggaranHeader = `ANGGARAN ${reportYear}`;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: 'Date range is required.' },
        { status: 400 }
      );
    }

    const allTransactions = await db
      .select({
        item: items.name,
        budget: categories.budget,
        amount: transactions.amount,
        date: transactions.date,
      })
      .from(transactions)
      .leftJoin(items, eq(transactions.itemId, items.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          gte(transactions.date, new Date(startDate)),
          lte(transactions.date, new Date(endDate)),
          lt(transactions.amount, 0)
        )
      );

    const monthsInRange = getMonthsInRange(
      new Date(startDate),
      new Date(endDate)
    );
    const monthHeaders = monthsInRange.map((d) =>
      format(d, 'MMMM', { locale: indonesiaLocale }).toUpperCase()
    );
    const reportData: { [key: string]: any } = {};
    allTransactions.forEach((tx) => {
      if (!tx.item) return;
      if (!reportData[tx.item]) {
        reportData[tx.item] = {
          URAIAN: tx.item,
          [anggaranHeader]: tx.budget || 0,
        };
        monthHeaders.forEach((header) => {
          if (tx.item) {
            reportData[tx.item][header] = 0;
          }
        });
      }
      const monthName = format(new Date(tx.date), 'MMMM', {
        locale: indonesiaLocale,
      }).toUpperCase();
      if (reportData[tx.item][monthName] !== undefined) {
        reportData[tx.item][monthName] += Math.abs(tx.amount);
      }
    });

    const wb = xlsx.utils.book_new();
    const wsData: any[][] = [];

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
    const stylePercent = { ...styleDataText, numFmt: '0.00%' };
    const styleFooter = { font: { name: 'Arial', sz: 10 } };

    wsData.push(['DEWAN KOMISARIS PT PLN (PERSERO)']);
    wsData.push(['LAPORAN PENGELUARAN']);
    wsData.push([
      `Untuk Periode ${format(new Date(startDate), 'MMMM', {
        locale: indonesiaLocale,
      })} s.d. ${format(new Date(endDate), 'MMMM yyyy', {
        locale: indonesiaLocale,
      })}`,
    ]);
    wsData.push([]);

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
        quarterMonths.forEach(() => {
          headerRow2.push(monthHeaders.shift()!);
          headerRow3.push(String(++columnCounter));
        });
        headerRow2.push('JUMLAH');
        headerRow3.push(String(++columnCounter));
        totalColCount += quarterMonths.length + 1;
      }
    });
    headerRow1.push('TOTAL', anggaranHeader, '% REALISASI');
    headerRow2.push(null, null, null);
    headerRow3.push(
      String(++columnCounter),
      String(++columnCounter),
      String(++columnCounter)
    );
    totalColCount += 3;

    wsData.push(headerRow1, headerRow2, headerRow3);

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
      dataRow.push(row[anggaranHeader]);
      dataRow.push(row[anggaranHeader] > 0 ? total / row[anggaranHeader] : 0);
      wsData.push(dataRow);
    });

    const ws = xlsx.utils.aoa_to_sheet(wsData, { cellStyles: true });

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
        ws['!merges']?.push({
          s: { r: 4, c: currentCol },
          e: { r: 4, c: currentCol + quarterMonths.length },
        });
        currentCol += quarterMonths.length + 1;
      }
    });
    ws['!merges'].push(
      { s: { r: 4, c: currentCol }, e: { r: 6, c: currentCol } },
      { s: { r: 4, c: currentCol + 1 }, e: { r: 6, c: currentCol + 1 } },
      { s: { r: 4, c: currentCol + 2 }, e: { r: 6, c: currentCol + 2 } }
    );

    ws['A1'].s = styleTitle;
    ws['A2'].s = styleTitle;
    ws['A3'].s = styleSubtitle;

    for (let c = 0; c < totalColCount; c++) {
      for (let r = 4; r <= 6; r++) {
        const cellRef = xlsx.utils.encode_cell({ r, c });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
        ws[cellRef].s =
          c === 0 && r > 4
            ? {
                ...styleHeader,
                alignment: { ...styleHeader.alignment, horizontal: 'left' },
              }
            : styleHeader;
      }
    }
    ws['A5'].s = styleHeader;

    for (let R = 7; R < wsData.length; R++) {
      ws[xlsx.utils.encode_cell({ r: R, c: 0 })].s = styleDataText;
      for (let C = 1; C < totalColCount; C++) {
        const cellRef = xlsx.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) ws[cellRef] = { v: 0 };
        if (C === totalColCount - 1) ws[cellRef].s = stylePercent;
        else ws[cellRef].s = styleCurrency;
      }
    }

    const footerRowIndex = wsData.length + 2;
    const footerText = `1   Dewan Komisaris PT (PLN) Persero Laporan Pengeluaran ${format(
      new Date(startDate),
      'MMMM',
      { locale: indonesiaLocale }
    )} s.d. ${format(new Date(endDate), 'MMMM yyyy', {
      locale: indonesiaLocale,
    })}`;
    xlsx.utils.sheet_add_aoa(ws, [[footerText]], {
      origin: `A${footerRowIndex}`,
    });
    if (ws[`A${footerRowIndex}`]) ws[`A${footerRowIndex}`].s = styleFooter;

    ws['!pageSetup'] = {
      orientation: 'portrait',
      paper: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
    };

    ws['!cols'] = [{ wch: 35 }, ...Array(totalColCount - 1).fill({ wch: 12 })];

    xlsx.utils.book_append_sheet(wb, ws, 'LAPORAN PENGELUARAN');
    const buffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="Laporan_Pengeluaran.xlsx"`,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('API Report Error:', error);
    return NextResponse.json(
      { message: 'Failed to generate report.' },
      { status: 500 }
    );
  }
}
