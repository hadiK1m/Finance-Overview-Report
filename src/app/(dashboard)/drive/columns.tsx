// src/app/(dashboard)/drive/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DriveItem } from './page';
import { Folder, File, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export const driveColumns: ColumnDef<DriveItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const item = row.original;
      const content = (
        <div className="flex items-center space-x-3">
          {item.type === 'folder' ? (
            <Folder className="h-5 w-5 text-blue-500 flex-shrink-0" />
          ) : (
            <File className="h-5 w-5 text-gray-500 flex-shrink-0" />
          )}
          <span className="font-medium truncate">{item.name}</span>
        </div>
      );

      if (item.type === 'file') {
        return (
          <Link
            href={item.path || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {content}
          </Link>
        );
      }
      return content;
    },
  },
  {
    accessorKey: 'modifiedAt',
    header: 'Date modified',
    cell: ({ row }) => {
      const date = new Date(row.getValue('modifiedAt'));
      return <span>{date.toLocaleDateString('en-GB')}</span>;
    },
  },
  {
    accessorKey: 'size',
    header: 'File size',
    cell: ({ row }) => {
      const size = row.original.size;
      if (size === null || size === undefined) {
        return <span>--</span>;
      }
      return <span>{`${(size / 1024).toFixed(2)} KB`}</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const item = row.original;
      const { onDelete, onFolderClick } = (table.options.meta as any) || {};

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
              {item.type === 'folder' && (
                <DropdownMenuItem onClick={() => onFolderClick?.(item)}>
                  Open folder
                </DropdownMenuItem>
              )}
              {item.type === 'file' && (
                <DropdownMenuItem asChild>
                  <Link
                    href={item.path || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Preview file
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete?.(item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
