// src/app/(dashboard)/transactions/page.tsx
'use client';
import * as React from 'react';
import Header from '@/components/Header';
import { columns, TransactionWithRelations } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { AddTransactionDialog } from './add-transaction-dialog';
import { EditTransactionDialog } from './edit-transaction-dialog';
import { UploadAttachmentDialog } from './upload-attachment-dialog'; // Impor dialog baru

export default function TransactionsPage() {
  const [data, setData] = React.useState<TransactionWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    React.useState<TransactionWithRelations | null>(null);

  // === Tambahkan state untuk dialog upload attachment ===
  const [isUploadAttachmentDialogOpen, setIsUploadAttachmentDialogOpen] =
    React.useState(false);
  const [transactionToUploadAttachment, setTransactionToUploadAttachment] =
    React.useState<TransactionWithRelations | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/transactions');
      const transactions = await response.json();
      setData(transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (ids: number[]) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete transactions');
      }
      await fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (transaction: TransactionWithRelations) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  // === Handler untuk membuka dialog upload attachment ===
  const handleUploadAttachment = (transaction: TransactionWithRelations) => {
    setTransactionToUploadAttachment(transaction);
    setIsUploadAttachmentDialogOpen(true);
  };

  return (
    <>
      <Header />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
            <p className="text-muted-foreground">
              Manage and track all your transactions.
            </p>
          </div>
          <AddTransactionDialog onTransactionAdded={fetchTransactions} />
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            filterColumnPlaceholder="payee..."
            dateFilterColumnId="date"
            onDelete={handleDelete}
            meta={{
              onEdit: handleEdit,
              onUploadAttachment: handleUploadAttachment, // Teruskan handler ke DataTable
            }}
          />
        )}
      </div>
      <EditTransactionDialog
        transaction={selectedTransaction}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTransactionUpdated={fetchTransactions}
      />
      {/* === Render dialog upload attachment === */}
      <UploadAttachmentDialog
        transaction={transactionToUploadAttachment}
        isOpen={isUploadAttachmentDialogOpen}
        onOpenChange={setIsUploadAttachmentDialogOpen}
        onAttachmentUploaded={fetchTransactions}
      />
    </>
  );
}
