// src/app/(dashboard)/items/page.tsx
'use client';

import * as React from 'react';
import Header from '@/components/Header';
import { columns, ItemWithCategory } from './columns'; // Impor tipe baru
import { DataTable } from '@/components/ui/data-table';
import { AddItemDialog } from './add-item-dialog'; // Impor dialog baru

export default function ItemsPage() {
  const [data, setData] = React.useState<ItemWithCategory[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      const items = await response.json();
      setData(items);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchItems();
  }, []);

  return (
    <>
      <Header />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Items List</h2>
            <p className="text-muted-foreground">
              Here's a list of all available items from the database.
            </p>
          </div>
          <AddItemDialog onItemAdded={fetchItems} />
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            filterColumnPlaceholder="items..."
            dateFilterColumnId="createdAt"
          />
        )}
      </div>
    </>
  );
}
