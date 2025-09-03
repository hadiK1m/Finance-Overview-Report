// src/app/(dashboard)/categories/page.tsx
'use client';

import * as React from 'react';
import Header from '@/components/Header';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { AddCategoryDialog } from './add-category-dialog';
import { Category } from '@/lib/category-data';

export default function CategoriesPage() {
  const [data, setData] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      const categories = await response.json();
      setData(categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (ids: number[]) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete categories');
      }

      // Refresh data tabel setelah berhasil menghapus
      await fetchCategories();
    } catch (error) {
      console.error(error);
      // Di sini Anda bisa menambahkan notifikasi error untuk pengguna
    }
  };

  return (
    <>
      <Header />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              RKAP Categories List
            </h2>
            <p className="text-muted-foreground">
              Here's a list of all product categories from the database.
            </p>
          </div>
          <AddCategoryDialog onCategoryAdded={fetchCategories} />
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            filterColumnPlaceholder="categories..."
            dateFilterColumnId="createdAt"
            onDelete={handleDelete} // prop ini
          />
        )}
      </div>
    </>
  );
}
