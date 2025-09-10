// src/app/(dashboard)/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RkapItemBreakdown } from '../../components/rkap/RkapItemBreakdown';
import { BalanceSheet } from './balancesheet/columns';
import { ArrowUp, ArrowDown, Wallet, Loader2 } from 'lucide-react';
import { eachDayOfInterval } from 'date-fns';

// --- INTERFACES ---
interface BalanceSheetWithTotals extends BalanceSheet {
  totalIncome: number;
  totalExpense: number;
}
interface ItemExpense {
  name: string;
  value: number;
}
interface RkapItemExpense {
  rkapName: string;
  budget: number;
  items: ItemExpense[];
}
interface DashboardData {
  balanceSheets: BalanceSheetWithTotals[];
  transactionHistory: { date: string; amount: number }[];
  overallTransactionHistory: { date: string; amount: number }[];
  rkapItemExpenses: RkapItemExpense[];
}

// --- FUNGSI HELPERS ---
const formatDailyChartData = (history: { date: string; amount: number }[]) => {
  if (!history) return [];
  const dailyData: { [key: string]: { dropping: number; expense: number } } =
    {};
  history.forEach((tx) => {
    const day = new Date(tx.date).toLocaleDateString('en-CA');
    if (!dailyData[day]) {
      dailyData[day] = { dropping: 0, expense: 0 };
    }
    if (tx.amount > 0) {
      dailyData[day].dropping += tx.amount;
    } else {
      dailyData[day].expense += Math.abs(tx.amount);
    }
  });
  return Object.keys(dailyData)
    .map((day) => ({
      name: new Date(day).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      dropping: dailyData[day].dropping,
      expense: dailyData[day].expense,
    }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
};

const formatCumulativeChartData = (
  history: { date: string; amount: number }[],
  startDate: Date,
  endDate: Date
) => {
  if (!history || !startDate || !endDate) return [];

  const dailyTotals: { [key: string]: { dropping: number; expense: number } } =
    {};
  history.forEach((tx) => {
    const day = new Date(tx.date).toLocaleDateString('en-CA');
    if (!dailyTotals[day]) {
      dailyTotals[day] = { dropping: 0, expense: 0 };
    }
    if (tx.amount > 0) {
      dailyTotals[day].dropping += tx.amount;
    } else {
      dailyTotals[day].expense += Math.abs(tx.amount);
    }
  });

  const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
  let cumulativeDropping = 0;
  let cumulativeExpense = 0;

  const cumulativeData = daysInRange.map((day) => {
    const dayString = day.toLocaleDateString('en-CA');
    if (dailyTotals[dayString]) {
      cumulativeDropping += dailyTotals[dayString].dropping;
      cumulativeExpense += dailyTotals[dayString].expense;
    }
    return {
      name: day.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      dropping: cumulativeDropping,
      expense: cumulativeExpense,
    };
  });

  return cumulativeData;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

// --- KOMPONEN UTAMA ---
export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [dateRange, setDateRange] = useState('365d');

  useEffect(() => {
    const fetchData = async () => {
      if (!pageLoading) {
        setChartLoading(true);
      }
      try {
        const response = await fetch(`/api/dashboard?range=${dateRange}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setPageLoading(false);
        setChartLoading(false);
      }
    };
    fetchData();
  }, [dateRange, pageLoading]);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - parseInt(dateRange.replace('d', '')));

  const dailyChartData = data
    ? formatDailyChartData(data.transactionHistory)
    : [];
  const overallChartData = data
    ? formatCumulativeChartData(
        data.overallTransactionHistory,
        startDate,
        endDate
      )
    : [];

  // Pastikan urutan balance sheets: Bank dulu, lalu Petty Cash, sisanya mengikuti urutan asli
  const orderedBalanceSheets = data
    ? (() => {
        const sheets = data.balanceSheets || [];
        const BANK = sheets.find((s) => s.name === 'BANK') ?? null;
        const petty = sheets.find((s) => s.name === 'Petty Cash') ?? null;
        const others = sheets.filter(
          (s) => s.name !== 'Bank' && s.name !== 'Petty Cash'
        );
        const result: typeof sheets = [];
        if (BANK) result.push(BANK);
        if (petty) result.push(petty);
        result.push(...others);
        return result;
      })()
    : [];

  // hapus duplikat berdasarkan id+name, pertahankan urutan
  const dedupedOrderedBalanceSheets = Array.from(
    new Map(
      orderedBalanceSheets.map((s) => [
        `${s.id}-${String(s.name).toLowerCase()}`,
        s,
      ])
    ).values()
  );

  if (pageLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Select range — pindahkan ke pojok kanan atas konten */}
      <div className="flex items-center justify-end">
        <div className="w-full md:w-auto md:mr-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Select a range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="180d">Last 6 Months</SelectItem>
              <SelectItem value="365d">Last 1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Bagian Card Saldo */}
      {dedupedOrderedBalanceSheets.map((sheet) => (
        <div key={sheet.id} className="mb-8">
          <CardTitle className="mb-4">{sheet.name}</CardTitle>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {/* Bank-style Balance Card (no white Card background) */}
            <div className="overflow-hidden rounded-lg h-full">
              <div className="rounded-lg bg-gradient-to-r from-sky-700 to-sky-800 text-white p-4 flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold leading-tight">
                      {sheet.name}
                    </div>
                  </div>
                  <Wallet className="h-6 w-6 opacity-90" />
                </div>

                <div className="mt-6 flex-1">
                  <div className="text-xs opacity-90">Balance</div>
                  <div className="text-2xl font-bold tracking-wider mt-1">
                    {formatCurrency(sheet.balance)}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-sm opacity-80">
                  <div className="text-left">
                    <div className="text-[11px]">Account</div>
                    <div className="font-medium">{sheet.name}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank-style Total Income Card (no white Card background) */}
            <div className="overflow-hidden rounded-lg h-full">
              <div className="rounded-lg bg-gradient-to-r from-sky-700 to-sky-800 text-white p-4 flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs opacity-90 uppercase">Income</div>
                    <div className="text-sm font-semibold leading-tight">
                      {sheet.name === 'Bank'
                        ? 'Dropping'
                        : sheet.name === 'Petty Cash'
                        ? 'Cash Advanced'
                        : 'Dropping'}
                    </div>
                  </div>
                  <ArrowUp className="h-6 w-6 opacity-90" />
                </div>

                <div className="mt-6 flex-1">
                  <div className="text-2xl font-bold">
                    {formatCurrency(sheet.totalIncome)}
                  </div>
                </div>

                <div className="mt-6 text-sm opacity-80">
                  <div className="text-[11px]">Period</div>
                  <div className="font-medium">
                    Last {dateRange.replace('d', ' days')}
                  </div>
                </div>
              </div>
            </div>

            {/* Bank-style Total Expense Card (no white Card background) */}
            <div className="overflow-hidden rounded-lg h-full">
              <div className="rounded-lg bg-gradient-to-r from-sky-700 to-sky-800 text-white p-4 flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs opacity-90 uppercase">Expense</div>
                    <div className="text-sm font-semibold leading-tight">
                      Total Expenses
                    </div>
                  </div>
                  <ArrowDown className="h-6 w-6 opacity-90" />
                </div>

                <div className="mt-6 flex-1">
                  <div className="text-2xl font-bold">
                    {formatCurrency(Math.abs(sheet.totalExpense))}
                  </div>
                </div>

                <div className="mt-6 text-sm opacity-80">
                  <div className="text-[11px]">Period</div>
                  <div className="font-medium">
                    Last {dateRange.replace('d', ' days')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Card untuk Area Chart dengan Tabs */}
      <Card>
        <Tabs defaultValue="daily">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <TabsList className="grid w-full grid-cols-2 max-w-[600px]">
              <TabsTrigger value="daily">
                Daily Transaction Overview
              </TabsTrigger>
              <TabsTrigger value="overall">
                Overall Expenses Overview
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pl-2">
            {chartLoading ? (
              <div className="h-[350px] w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
              </div>
            ) : (
              <>
                <TabsContent value="daily">
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={dailyChartData}>
                      <defs>
                        <linearGradient
                          id="colorDropping"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorExpense"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          `Rp${new Intl.NumberFormat('id-ID').format(
                            value as number
                          )}`
                        }
                      />
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="dropping"
                        name="dropping"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorDropping)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="overall">
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={overallChartData}>
                      <defs>
                        <linearGradient
                          id="colorOverallDropping"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorOverallExpense"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f97316"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f97316"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          `Rp${new Intl.NumberFormat('id-ID').format(
                            value as number
                          )}`
                        }
                      />
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Legend />

                      <Area
                        type="monotone"
                        dataKey="dropping"
                        name="dropping"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorOverallDropping)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#f97316"
                        fillOpacity={1}
                        fill="url(#colorOverallExpense)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
              </>
            )}
          </CardContent>
        </Tabs>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">
          Item Expense Breakdown by RKAP
        </h2>
        <RkapItemBreakdown
          data={data?.rkapItemExpenses || []}
          isLoading={chartLoading}
        />
      </div>
    </div>
  );
}
