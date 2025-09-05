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
  // Ubah menjadi nullable agar bisa di-reset
  attachment: z.instanceof(File).optional().nullable(),
});

// === PERBARUI SKEMA API DI BAWAH INI ===
export const apiTransactionSchema = transactionFormSchema
  // Hapus validasi untuk 'attachment' karena API tidak menerima File object
  .omit({ attachment: true })
  .extend({
    // Tetap transformasikan date dari string ke Date object
    date: z.string().transform((str) => new Date(str)),
    // Pastikan attachmentUrl bisa string, opsional, atau null
    attachmentUrl: z.string().optional().nullable(),
  });
