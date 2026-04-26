import { pgTable, text, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export type DiscountType = "percentage" | "fixed";

export const discountsTable = pgTable("discounts", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").$type<DiscountType>().notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  minSubtotal: numeric("min_subtotal", { precision: 12, scale: 2 }),
  active: boolean("active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  usageLimit: integer("usage_limit"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DiscountRow = typeof discountsTable.$inferSelect;
