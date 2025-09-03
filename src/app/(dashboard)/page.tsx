// src/app/(dashboard)/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BalanceSheet } from './balancesheet/columns';
import { ArrowUp, ArrowDown, Wallet } from 'lucide-react'; // Impor ikon baru

// Perbarui tipe data untuk mencakup total income dan expense
interface BalanceSheetWithTotals extends BalanceSheet {
  totalIncome: number;
  totalExpense: number;
}

interface DashboardData {
  balanceSheets: BalanceSheetWithTotals[];
  transactionHistory: { date: string; amount: number }[];
}

const formatChartData = (history: { date: string; amount: number }[]) => {
  // ... (fungsi ini tetap sama)
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

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = data ? formatChartData(data.transactionHistory) : [];
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);

  if (loading) {
    return (
      <>
        <Header />
        <div className="p-8">Loading dashboard...</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="p-8 space-y-8">
        {/* Bagian Card */}
        {data?.balanceSheets.map((sheet) => (
          <div key={sheet.id} className="mb-8">
            <CardTitle className="mb-4">{sheet.name}</CardTitle>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Card: Current Balance */}
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
              {/* Card: Total Income */}
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
              {/* Card: Total Expenses */}
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

        {/* Bagian Grafik */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overall Transaction Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <Tooltip
                  formatter={(value) =>
                    new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                    }).format(value as number)
                  }
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}
