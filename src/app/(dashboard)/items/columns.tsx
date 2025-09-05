// src/app/(dashboard)/items/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ItemWithCategory = {
  id: number;
  name: string;
  createdAt: string;
  editedAt?: string | Date | null;
  categoryId: number;
  category: {
    name: string;
  } | null;
};

export const columns: ColumnDef<ItemWithCategory>[] = [
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
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Item Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'category.name',
    header: 'RKAP Name',
    cell: ({ row }) => {
      const category = row.original.category;
      return category ? category.name : 'N/A';
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return <span>{date.toLocaleDateString('en-GB')}</span>;
    },
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
      const item = row.original;
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
              onClick={() => navigator.clipboard.writeText(String(item.id))}
            >
              Copy item ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Item "View details" telah dihapus dari sini */}
            <DropdownMenuItem onClick={() => onEdit?.(item)}>
              Edit item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
