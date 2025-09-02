// src/lib/transaction-data.ts
import { z } from 'zod';

// Definisikan skema data untuk Transaction
export const transactionSchema = z.object({
  id: z.string(),
  date: z.date(),
  rkapName: z.string(),
  item: z.string(),
  payee: z.string(),
  amount: z.number(),
  account: z.string(),
  hasAttachment: z.boolean(),
});

export type Transaction = z.infer<typeof transactionSchema>;

// Buat data sampel
export const sampleTransactions: Transaction[] = [
  {
    id: 'TRN-001',
    date: new Date('2023-08-01'),
    rkapName: 'Q3 Laptop Refresh',
    item: 'Dell XPS 15',
    payee: 'Tech Supplier Inc.',
    amount: 25000000,
    account: 'Operational',
    hasAttachment: true,
  },
  {
    id: 'TRN-002',
    date: new Date('2023-08-03'),
    rkapName: 'Office Ergonomics',
    item: 'Logitech MX Master 3S',
    payee: 'Office Depot',
    amount: 1500000,
    account: 'Capital',
    hasAttachment: false,
  },
  {
    id: 'TRN-003',
    date: new Date('2023-08-05'),
    rkapName: 'Mobile Device Upgrade',
    item: 'iPhone 15 Pro',
    payee: 'Cellular World',
    amount: 18000000,
    account: 'Operational',
    hasAttachment: true,
  },
  {
    id: 'TRN-004',
    date: new Date('2023-08-10'),
    rkapName: 'New Monitors Purchase',
    item: 'Samsung Odyssey G9',
    payee: 'Tech Supplier Inc.',
    amount: 15000000,
    account: 'Capital',
    hasAttachment: false,
  },
  {
    id: 'TRN-005',
    date: new Date('2023-08-12'),
    rkapName: 'Office Ergonomics',
    item: 'Steelcase Gesture Chair',
    payee: 'Furniture Palace',
    amount: 12500000,
    account: 'Capital',
    hasAttachment: true,
  },
];
