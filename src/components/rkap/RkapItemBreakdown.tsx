// src/components/rkap/RkapItemBreakdown.tsx
'use client';

import * as React from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';

// --- INTERFACES ---
interface ItemExpense {
  name: string;
  value: number;
}
interface RkapItemExpense {
  rkapName: string;
  budget: number;
  items: ItemExpense[];
}
interface RkapItemBreakdownProps {
  data: RkapItemExpense[];
  isLoading: boolean;
}

// --- FUNGSI HELPER ---
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

// tambahkan array warna eksplisit (fallback)
const COLORS = [
  '#1e3a8a', // indigo-800
  '#2563eb', // blue-600
  '#3b82f6', // blue-500
  '#60a5fa', // blue-400
  '#93c5fd', // blue-300
  '#bfdbfe', // blue-200
  '#e0f2fe', // blue-100
  '#0f172a', // very dark blue / slate
];

// --- KOMPONEN UTAMA ---
export function RkapItemBreakdown({ data, isLoading }: RkapItemBreakdownProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded-md w-3/4 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-200 rounded-md w-full animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            No item expense data available for the selected period.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {data.map(({ rkapName, items, budget }) => {
        const chartConfig = items.reduce((acc, item, index) => {
          acc[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length],
          };
          return acc;
        }, {} as ChartConfig);

        const totalUsed = items.reduce((sum, item) => sum + item.value, 0);
        const remaining = Math.max(0, budget - totalUsed);

        return (
          <Card key={rkapName} className="flex flex-col">
            <CardHeader className="items-center pb-2">
              <CardTitle>{rkapName}</CardTitle>
              <CardDescription>
                Budget: {formatCurrency(budget)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[300px] pb-0"
              >
                {/* --- PERUBAHAN DI SINI --- */}
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name,
                      ]}
                    />
                    <Pie data={items} dataKey="value" nameKey="name">
                      {items.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={COLORS[idx % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm pt-4">
              <div className="flex w-full items-center justify-between font-medium">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" />
                  <span>Used</span>
                </div>
                <span>{formatCurrency(totalUsed)}</span>
              </div>
              <div className="flex w-full items-center justify-between text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-muted" />
                  <span>Remaining</span>
                </div>
                <span>{formatCurrency(remaining)}</span>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
