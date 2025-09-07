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
  foreignKey,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enum untuk Role Pengguna
export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'assistant_admin',
  'vip',
  'member',
]);

// Tabel untuk pengguna
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: varchar('full_name', { length: 256 }),
  email: varchar('email', { length: 256 }).notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').default('member').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel untuk kategori (RKAP)
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  budget: integer('budget').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  editedAt: timestamp('edited_at').$onUpdate(() => new Date()),
});

// Tabel untuk item
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  categoryId: integer('category_id')
    .references(() => categories.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  editedAt: timestamp('edited_at').$onUpdate(() => new Date()),
});

// Tabel untuk neraca (Balance Sheet)
export const balanceSheet = pgTable('balance_sheet', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  balance: integer('balance').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  editedAt: timestamp('edited_at').$onUpdate(() => new Date()),
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
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel untuk menyimpan file dan folder di drive
export const driveItems = pgTable(
  'drive_items',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    type: varchar('type', { length: 50, enum: ['file', 'folder'] }).notNull(),
    path: text('path'),
    size: integer('size'),
    parentId: integer('parent_id'),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    modifiedAt: timestamp('edited_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      parentReference: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
      }).onDelete('cascade'),
    };
  }
);

// === DEFINISI RELASI ANTAR TABEL ===

export const usersRelations = relations(users, ({ many }) => ({
  driveItems: many(driveItems),
  transactions: many(transactions),
}));

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
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const driveItemsRelations = relations(driveItems, ({ one, many }) => ({
  user: one(users, {
    fields: [driveItems.userId],
    references: [users.id],
  }),
  parent: one(driveItems, {
    fields: [driveItems.parentId],
    references: [driveItems.id],
    relationName: 'parent',
  }),
  children: many(driveItems, {
    relationName: 'parent',
  }),
}));
