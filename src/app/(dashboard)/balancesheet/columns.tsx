// src/app/(dashboard)/balancesheet/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type BalanceSheet = {
  id: number;
  name: string;
  balance: number;
  createdAt: string;
  editedAt?: string | Date | null; // Kolom baru ditambahkan di sini
};

export const columns: ColumnDef<BalanceSheet>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  { accessorKey: 'name', header: 'Balance Sheet' },
  {
    accessorKey: 'balance',
    header: () => <div className="text-right">Balance</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('balance'));
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) =>
      new Date(row.getValue('createdAt')).toLocaleDateString('en-GB'),
    filterFn: (row, columnId, value) => {
      const date = new Date(row.getValue(columnId));
      const [start, end] = value as [Date, Date];
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      return date >= startDate && date <= endDate;
    },
  },
  {
    accessorKey: 'editedAt',
    header: 'Updated At',
    cell: ({ row }) => {
      const date: string | null = row.getValue('editedAt');
      if (!date) {
        return <span>-</span>;
      }
      return <span>{new Date(date).toLocaleDateString('en-GB')}</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const sheet = row.original;
      const { onEdit } = (table.options.meta as any) || {};
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(String(sheet.id))}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(sheet)}>
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
