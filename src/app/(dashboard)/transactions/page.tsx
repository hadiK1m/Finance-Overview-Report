// src/app/(dashboard)/transactions/page.tsx
'use client';
import * as React from 'react';
import { getTransactionColumns, TransactionWithRelations } from './columns'; // <-- Perbarui impor ini
import { DataTable } from '@/components/ui/data-table';
import { AddTransactionDialog } from './add-transaction-dialog';
import { EditTransactionDialog } from './edit-transaction-dialog';
import { UploadAttachmentDialog } from './upload-attachment-dialog';
import { ImportCsvDialog } from './import-csv-dialog';
import { User } from '../teams/columns';

export default function TransactionsPage() {
  const [data, setData] = React.useState<TransactionWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    React.useState<TransactionWithRelations | null>(null);
  const [isUploadAttachmentDialogOpen, setIsUploadAttachmentDialogOpen] =
    React.useState(false);
  const [transactionToUploadAttachment, setTransactionToUploadAttachment] =
    React.useState<TransactionWithRelations | null>(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [transactionsRes, sessionRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/auth/session'),
      ]);
      const transactions = await transactionsRes.json();
      const session = await sessionRes.json();
      setData(transactions);
      setCurrentUser(session.user);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionsOnly = async () => {
    try {
      const response = await fetch('/api/transactions');
      setData(await response.json());
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  React.useEffect(() => {
    fetchInitialData();
  }, []);

  const handleDelete = async (ids: number[]) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error('Failed to delete transactions');
      await fetchTransactionsOnly();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (transaction: TransactionWithRelations) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleUploadAttachment = (transaction: TransactionWithRelations) => {
    setTransactionToUploadAttachment(transaction);
    setIsUploadAttachmentDialogOpen(true);
  };

  const columns = React.useMemo(
    () => getTransactionColumns(currentUser),
    [currentUser]
  );
  const canModify =
    currentUser?.role === 'admin' || currentUser?.role === 'assistant_admin';

  return (
    <>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
            <p className="text-muted-foreground">
              Manage and track all your transactions.
            </p>
          </div>
          {canModify && (
            <AddTransactionDialog onTransactionAdded={fetchTransactionsOnly} />
          )}
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            filterColumnPlaceholder="payee..."
            dateFilterColumnId="date"
            onDelete={canModify ? handleDelete : undefined}
            meta={{
              onEdit: handleEdit,
              onUploadAttachment: handleUploadAttachment,
            }}
            exportButtonLabel="Export Triwulan"
            toolbarActions={
              canModify ? (
                <ImportCsvDialog onImportSuccess={fetchTransactionsOnly} />
              ) : null
            }
          />
        )}
      </div>
      <EditTransactionDialog
        transaction={selectedTransaction}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTransactionUpdated={fetchTransactionsOnly}
      />
      <UploadAttachmentDialog
        transaction={transactionToUploadAttachment}
        isOpen={isUploadAttachmentDialogOpen}
        onOpenChange={setIsUploadAttachmentDialogOpen}
        onAttachmentUploaded={fetchTransactionsOnly}
      />
    </>
  );
}
