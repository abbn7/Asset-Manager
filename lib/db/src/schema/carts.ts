import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const cartsTable = pgTable("carts", {
  token: text("token").primaryKey(),
  appliedDiscountCode: text("applied_discount_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CartRow = typeof cartsTable.$inferSelect;
