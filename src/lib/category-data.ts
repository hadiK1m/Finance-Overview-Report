// src/lib/category-data.ts
import { z } from "zod"

// 1. Ubah 'status' menjadi 'budget' dengan tipe number
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  budget: z.number(), // Diubah dari 'status'
  itemCount: z.number(),
  createdAt: z.date(),
})

export type Category = z.infer<typeof categorySchema>

// 2. Perbarui data sampel untuk menggunakan 'budget'
export const sampleCategories: Category[] = [
  { id: "CAT-8782", name: "Laptops", budget: 50000, itemCount: 25, createdAt: new Date("2023-01-15") },
  { id: "CAT-3421", name: "Smartphones", budget: 120000, itemCount: 150, createdAt: new Date("2023-02-20") },
  { id: "CAT-5954", name: "Accessories", budget: 75000, itemCount: 340, createdAt: new Date("2023-03-05") },
  { id: "CAT-1234", name: "Gaming Consoles", budget: 0, itemCount: 0, createdAt: new Date("2022-11-10") },
  { id: "CAT-9876", name: "Monitors", budget: 85000, itemCount: 78, createdAt: new Date("2023-04-22") },
  { id: "CAT-4567", name: "Keyboards", budget: 30000, itemCount: 210, createdAt: new Date("2023-05-30") },
  { id: "CAT-7890", name: "Mice", budget: 25000, itemCount: 450, createdAt: new Date("2023-06-18") },
  { id: "CAT-2345", name: "Webcams", budget: 5000, itemCount: 5, createdAt: new Date("2023-01-02") },
];