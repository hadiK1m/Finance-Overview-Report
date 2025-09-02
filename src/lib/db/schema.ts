// src/lib/db/schema.ts
import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';

// Tabel untuk pengguna
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: varchar('full_name', { length: 256 }),
  email: varchar('email', { length: 256 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel untuk kategori (RKAP)
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  budget: integer('budget').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel untuk item
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  categoryId: integer('category_id')
    .references(() => categories.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel untuk neraca (Balance Sheet)
export const balanceSheet = pgTable('balance_sheet', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  balance: integer('balance').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel untuk transaksi
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  categoryId: integer('category_id')
    .references(() => categories.id, { onDelete: 'cascade' })
    .notNull(),
  itemId: integer('item_id')
    .references(() => items.id, { onDelete: 'cascade' })
    .notNull(),
  payee: varchar('payee', { length: 256 }).notNull(),
  amount: integer('amount').notNull(),
  balanceSheetId: integer('balance_sheet_id').references(
    () => balanceSheet.id,
    { onDelete: 'set null' }
  ),
  attachmentUrl: text('attachment_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// === DEFINISI RELASI ANTAR TABEL ===

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(items),
  transactions: many(transactions),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  item: one(items, {
    fields: [transactions.itemId],
    references: [items.id],
  }),
  balanceSheet: one(balanceSheet, {
    fields: [transactions.balanceSheetId],
    references: [balanceSheet.id],
  }),
}));
