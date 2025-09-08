// src/app/(dashboard)/balancesheet/page.tsx
'use client';
import * as React from 'react';

import { columns, BalanceSheet } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { AddBalanceSheetDialog } from './add-balancesheet-dialog';
import { EditBalanceSheetDialog } from './edit-balancesheet-dialog'; // <-- Impor dialog edit

export default function BalanceSheetPage() {
  const [data, setData] = React.useState<BalanceSheet[]>([]);
  const [loading, setLoading] = React.useState(true);

  // State untuk dialog edit
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedSheet, setSelectedSheet] = React.useState<BalanceSheet | null>(
    null
  );

  const fetchSheets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/balancesheet');
      setData(await response.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSheets();
  }, []);

  const handleDelete = async (ids: number[]) => {
    try {
      await fetch('/api/balancesheet', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      // Refresh data setelah berhasil menghapus
      await fetchSheets();
    } catch (error) {
      console.error('Failed to delete items:', error);
    }
  };

  // Fungsi untuk membuka dialog edit
  const handleEdit = (sheet: BalanceSheet) => {
    setSelectedSheet(sheet);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Cash & Balance
            </h2>
            <p className="text-muted-foreground">Manage your balance sheets.</p>
          </div>
          <AddBalanceSheetDialog onSheetAdded={fetchSheets} />
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            filterColumnPlaceholder="balance sheets..."
            dateFilterColumnId="createdAt"
            onDelete={handleDelete}
            meta={{
              onEdit: handleEdit, // <-- Kirim fungsi edit ke tabel
            }}
          />
        )}
      </div>
      {/* Render komponen dialog edit */}
      <EditBalanceSheetDialog
        sheet={selectedSheet}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSheetUpdated={fetchSheets}
      />
    </>
  );
}
