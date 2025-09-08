// src/app/(dashboard)/items/page.tsx
'use client';

import * as React from 'react';

import { columns, ItemWithCategory } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { AddItemDialog } from './add-item-dialog';
import { EditItemDialog } from './edit-item-dialog';

export default function ItemsPage() {
  const [data, setData] = React.useState<ItemWithCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] =
    React.useState<ItemWithCategory | null>(null);

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

  const handleDelete = async (ids: number[]) => {
    try {
      const response = await fetch('/api/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete items');
      }

      // Refresh data tabel setelah berhasil menghapus
      await fetchItems();
    } catch (error) {
      console.error(error);
      // Anda bisa menambahkan notifikasi error untuk pengguna di sini
    }
  };

  const handleEdit = (item: ItemWithCategory) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  return (
    <>
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
            onDelete={handleDelete}
            meta={{
              onEdit: handleEdit,
            }}
          />
        )}
      </div>
      <EditItemDialog
        item={selectedItem}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onItemUpdated={fetchItems}
      />
    </>
  );
}
