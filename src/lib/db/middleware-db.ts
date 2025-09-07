// src/lib/db/middleware-db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
// Impor hanya tabel, bukan semua skema dengan relasi
import {
  users,
  categories,
  items,
  balanceSheet,
  transactions,
  driveItems,
} from './schema';

const connectionString = process.env.POSTGRES_URL!;

const client = postgres(connectionString, { prepare: false });

// Inisialisasi db dengan skema yang hanya berisi tabel
export const db = drizzle(client, {
  schema: { users, categories, items, balanceSheet, transactions, driveItems },
});
