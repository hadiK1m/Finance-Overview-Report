// src/lib/schemas.ts
import * as z from 'zod';

export const transactionFormSchema = z.object({
  date: z
    .date()
    .min(new Date('1900-01-01'), { message: 'A date is required.' }),
  item: z.string().min(1, { message: 'Please select an item.' }),
  rkapName: z.string().min(1, { message: 'Please select an RKAP Name.' }),
  payee: z.string().min(1, 'Payee is required.'),
  amount: z
    .number()
    .refine((val) => val !== 0, { message: 'Amount cannot be zero.' }),
  balanceSheetId: z
    .string()
    .min(1, { message: 'Please select a balance sheet.' }),
  // --- PERBAIKAN: Membuat validasi File hanya berjalan di sisi client ---
  attachment:
    typeof window === 'undefined'
      ? z.any()
      : z.instanceof(File).optional().nullable(),
});

// Skema untuk API tetap sama dan aman untuk server
export const apiTransactionSchema = transactionFormSchema
  .omit({ attachment: true })
  .extend({
    date: z.string().transform((str) => new Date(str)),
    attachmentUrl: z.string().optional().nullable(),
  });
