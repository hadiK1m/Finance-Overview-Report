// src/app/(dashboard)/transactions/page.tsx
'use client';
import * as React from 'react';
import Header from '@/components/Header';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { AddTransactionDialog } from './add-transaction-dialog';

export default function TransactionsPage() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

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

      await fetchTransactions(); // Refresh data setelah berhasil
    } catch (error) {
      console.error(error);
    }
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
            onDelete={handleDelete} // Tambahkan prop ini
          />
        )}
      </div>
    </>
  );
}
