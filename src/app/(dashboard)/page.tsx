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
// --- PERBAIKAN: Menggunakan path relatif untuk mengatasi error resolusi modul ---
import { RkapItemBreakdown } from '../../components/rkap/RkapItemBreakdown';
import { BalanceSheet } from './balancesheet/columns';
import { ArrowUp, ArrowDown, Wallet, Loader2 } from 'lucide-react';

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
  overallTransactionHistory: { date: string; balance: number }[]; // Data baru untuk grafik overall
  rkapItemExpenses: RkapItemExpense[];
}

// --- FUNGSI HELPERS ---
const formatDailyChartData = (history: { date: string; amount: number }[]) => {
  const dailyData: { [key: string]: { income: number; expense: number } } = {};
  history.forEach((tx) => {
    const day = new Date(tx.date).toLocaleDateString('en-CA');
    if (!dailyData[day]) {
      dailyData[day] = { income: 0, expense: 0 };
    }
    if (tx.amount > 0) {
      dailyData[day].income += tx.amount;
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
      income: dailyData[day].income,
      expense: dailyData[day].expense,
    }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
};

const formatOverallChartData = (
  history: { date: string; balance: number }[]
) => {
  if (!history || history.length === 0) return [];
  return history.map((day) => ({
    name: new Date(day.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    balance: day.balance,
  }));
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
  const [dateRange, setDateRange] = useState('180d');

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

  const dailyChartData = data
    ? formatDailyChartData(data.transactionHistory)
    : [];
  const overallChartData = data
    ? formatOverallChartData(data.overallTransactionHistory)
    : [];

  if (pageLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Bagian Card Saldo */}
      {data?.balanceSheets.map((sheet) => (
        <div key={sheet.id} className="mb-8">
          <CardTitle className="mb-4">{sheet.name}</CardTitle>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Balance
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(sheet.balance)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Income
                </CardTitle>
                <ArrowUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(sheet.totalIncome)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
                <ArrowDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Math.abs(sheet.totalExpense))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}

      {/* Card untuk Area Chart dengan Tabs */}
      <Card>
        <Tabs defaultValue="daily">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="daily">
                Daily Transaction Overview
              </TabsTrigger>
              <TabsTrigger value="overall">
                Overall Balance Overview
              </TabsTrigger>
            </TabsList>
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
                          id="colorIncome"
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
                        dataKey="income"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorIncome)"
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
                          id="colorBalance"
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
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorBalance)"
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
