import { pgTable, text, timestamp, boolean, numeric, integer, jsonb } from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  fullDescription: text("full_description").notNull().default(""),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  compareAtPrice: numeric("compare_at_price", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  variants: jsonb("variants").$type<Array<{ id: string; name: string; value: string; price: number; inStock: boolean }>>().notNull().default([]),
  inStock: boolean("in_stock").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  unitsSold: integer("units_sold").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProductRow = typeof productsTable.$inferSelect;
