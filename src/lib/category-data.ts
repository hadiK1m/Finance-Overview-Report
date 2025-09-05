// src/lib/category-data.ts
import { z } from 'zod';

// Skema ini digunakan untuk validasi form saat menambah/mengedit kategori.
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  budget: z.number(),
  itemCount: z.number(),
  createdAt: z.date(),
});

// Tipe ini digunakan di seluruh frontend (halaman, komponen tabel)
export type Category = {
  id: number;
  name: string;
  budget: number;
  itemCount: number;
  createdAt: string | Date;
  editedAt?: string | Date | null; // Dibuat opsional karena data lama mungkin tidak memilikinya
};

// Data sampel ini tidak lagi digunakan secara aktif oleh halaman,
// tapi bisa berguna untuk testing atau sebagai fallback.
export const sampleCategories: Category[] = [
  {
    id: 1,
    name: 'Laptops',
    budget: 50000,
    itemCount: 25,
    createdAt: new Date('2023-01-15'),
  },
  {
    id: 2,
    name: 'Smartphones',
    budget: 120000,
    itemCount: 150,
    createdAt: new Date('2023-02-20'),
  },
  {
    id: 3,
    name: 'Accessories',
    budget: 75000,
    itemCount: 340,
    createdAt: new Date('2023-03-05'),
  },
  {
    id: 4,
    name: 'Gaming Consoles',
    budget: 0,
    itemCount: 0,
    createdAt: new Date('2022-11-10'),
  },
];
