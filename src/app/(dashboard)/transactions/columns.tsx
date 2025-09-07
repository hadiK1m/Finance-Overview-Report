// src/app/(dashboard)/teams/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Pastikan tipe User di sini sudah lengkap
export type User = {
  id: number;
  fullName: string | null;
  email: string;
  role: 'admin' | 'assistant_admin' | 'vip' | 'member'; // Termasuk 'vip' dan 'member'
  avatarUrl: string | null;
  createdAt: string;
};

export const columns: ColumnDef<User>[] = [
  // ... sisa kode tidak perlu diubah, sudah benar
  {
    accessorKey: 'fullName',
    header: 'Full Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as User['role'];
      const variant: 'default' | 'secondary' | 'outline' =
        role === 'admin'
          ? 'default'
          : role === 'assistant_admin'
          ? 'secondary'
          : 'outline';

      return (
        <Badge variant={variant} className="capitalize">
          {role.replace('_', ' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Joined At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      new Date(row.getValue('createdAt')).toLocaleDateString('en-GB'),
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row, table }) => {
      const user = row.original;
      const { onChangeRole, currentUser } = (table.options.meta as any) || {};
      const isCurrentUser = currentUser?.id === user.id;

      return (
        <div className="text-right">
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
                onClick={() => onChangeRole?.(user)}
                disabled={currentUser?.role !== 'admin' || isCurrentUser}
              >
                Change Role
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                disabled={isCurrentUser}
              >
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
