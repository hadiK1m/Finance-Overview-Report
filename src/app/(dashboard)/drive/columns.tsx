// src/app/(dashboard)/drive/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DriveItem } from '@/lib/drive-data';
import { Folder, File } from 'lucide-react';

export const driveColumns: ColumnDef<DriveItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center space-x-3">
          {item.type === 'folder' ? (
            <Folder className="h-5 w-5 text-blue-500" />
          ) : (
            <File className="h-5 w-5 text-gray-500" />
          )}
          <span className="font-medium">{item.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'modified',
    header: 'Date modified',
  },
  {
    accessorKey: 'size',
    header: 'File size',
    cell: ({ row }) => {
      return <span>{row.original.size || '--'}</span>;
    },
  },
];
