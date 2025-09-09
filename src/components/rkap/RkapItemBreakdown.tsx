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
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
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

// **PERUBAHAN WARNA: Palet warna gradasi merah/rose**
const COLORS = [
  '#881337', // rose-900
  '#be123c', // rose-700
  '#e11d48', // rose-600
  '#f43f5e', // rose-400
  '#fb7185', // rose-300
  '#fecdd3', // rose-200
  '#ffe4e6', // rose-100
  '#4c0519', // rose-950
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
        const totalUsed = items.reduce((sum, item) => sum + item.value, 0);
        const remaining = Math.max(0, budget - totalUsed);

        const chartData = [...items];
        if (remaining > 0) {
          chartData.push({ name: 'Remaining', value: remaining });
        }

        const chartConfig = items.reduce((acc, item, index) => {
          acc[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length],
          };
          return acc;
        }, {} as ChartConfig);

        chartConfig['Remaining'] = {
          label: 'Remaining',
          color: '#facc15', // Warna kuning (Tailwind yellow-400)
        };

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
                {/* **FIX: Menghapus <ResponsiveContainer> yang berlebihan** */}
                <PieChart>
                  <Tooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                        nameKey="name"
                        hideLabel
                      />
                    }
                  />
                  <Pie data={chartData} dataKey="value" nameKey="name">
                    {chartData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={chartConfig[entry.name]?.color || '#8884d8'}
                      />
                    ))}
                  </Pie>
                </PieChart>
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
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: chartConfig['Remaining'].color }}
                  />
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
