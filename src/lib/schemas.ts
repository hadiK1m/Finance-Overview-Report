// src/lib/schemas.ts
import * as z from 'zod';

export const transactionFormSchema = z.object({
  date: z.date({ required_error: 'A date is required.' }),
  item: z.string().min(1, { message: 'Please select an item.' }),
  rkapName: z.string().min(1, { message: 'Please select an RKAP Name.' }),
  payee: z.string().min(1, 'Payee is required.'),
  amount: z
    .number()
    .refine((val) => val !== 0, { message: 'Amount cannot be zero.' }),
  balanceSheetId: z
    .string()
    .min(1, { message: 'Please select a balance sheet.' }),
  attachment: z.instanceof(File).optional(),
});

export const apiTransactionSchema = transactionFormSchema.extend({
  // API akan menerima tanggal sebagai string dan mengubahnya
  date: z.string().transform((str) => new Date(str)),
  attachmentUrl: z.string().url().optional(),
});
