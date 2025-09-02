// src/lib/item-data.ts
import { z } from 'zod';

// Definisikan skema data untuk Item
export const itemSchema = z.object({
  id: z.string(),
  itemName: z.string(),
  rkapName: z.string(),
  createdAt: z.date(),
});

export type Item = z.infer<typeof itemSchema>;

// Buat data sampel
export const sampleItems: Item[] = [
  {
    id: 'ITM-001',
    itemName: 'Dell XPS 15',
    rkapName: 'Q3 Laptop Refresh',
    createdAt: new Date('2023-07-01'),
  },
  {
    id: 'ITM-002',
    itemName: 'Logitech MX Master 3S',
    rkapName: 'Office Ergonomics',
    createdAt: new Date('2023-07-05'),
  },
  {
    id: 'ITM-003',
    itemName: 'iPhone 15 Pro',
    rkapName: 'Mobile Device Upgrade',
    createdAt: new Date('2023-07-10'),
  },
  {
    id: 'ITM-004',
    itemName: 'Samsung Odyssey G9',
    rkapName: 'New Monitors Purchase',
    createdAt: new Date('2023-07-12'),
  },
  {
    id: 'ITM-005',
    itemName: 'Steelcase Gesture Chair',
    rkapName: 'Office Ergonomics',
    createdAt: new Date('2023-07-15'),
  },
];
