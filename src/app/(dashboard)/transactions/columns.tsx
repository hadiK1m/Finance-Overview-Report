// src/app/(dashboard)/transactions/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Paperclip } from 'lucide-react';
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

export type TransactionWithRelations = {
  id: number;
  date: string;
  payee: string;
  amount: number;
  attachmentUrl: string | null;
  createdAt: string;
  categoryId: number;
  itemId: number;
  balanceSheetId: number | null;
  category: { name: string } | null;
  item: { name: string } | null;
  balanceSheet: { name: string } | null;
};

export const columns: ColumnDef<TransactionWithRelations>[] = [
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
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <span>{new Date(row.getValue('date')).toLocaleDateString('en-GB')}</span>
    ),
  },
  {
    accessorKey: 'category.name',
    header: 'RKAP Name',
  },
  {
    accessorKey: 'item.name',
    header: 'Item',
  },
  {
    accessorKey: 'payee',
    header: 'Payee',
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
      return (
        <div
          className={`text-right font-medium ${
            amount < 0 ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {formatted}
        </div>
      );
    },
  },
  {
    accessorKey: 'balanceSheet.name',
    header: 'Balance Sheet',
  },
  {
    accessorKey: 'attachmentUrl',
    header: 'Attachment',
    cell: ({ row, table }) => {
      const url = row.getValue('attachmentUrl') as string | null;
      const transaction = row.original;
      const { onUploadAttachment } = (table.options.meta as any) || {};

      if (url) {
        // Jika URL ada, tampilkan "Sudah PJ" dengan ikon biru
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:underline"
          >
            <Paperclip className="h-4 w-4 mr-1" />
            Sudah PJ
          </a>
        );
      }

      // Jika tidak ada URL, tampilkan "Belum PJ" dengan ikon merah yang bisa diklik
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-2 py-1 text-red-600 hover:text-red-700"
          onClick={() => onUploadAttachment?.(transaction)}
        >
          <Paperclip className="h-4 w-4 mr-1 text-red-500" />
          Belum PJ
        </Button>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const transaction = row.original;
      const { onEdit, onUploadAttachment } = (table.options.meta as any) || {};
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
              onClick={() =>
                navigator.clipboard.writeText(String(transaction.id))
              }
            >
              Copy transaction ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
              Edit transaction
            </DropdownMenuItem>
            {transaction.attachmentUrl ? (
              <DropdownMenuItem asChild>
                <a
                  href={transaction.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download attachment
                </a>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => onUploadAttachment?.(transaction)}
              >
                Upload attachment
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
