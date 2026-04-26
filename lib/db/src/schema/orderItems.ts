import { pgTable, text, integer, numeric } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";

export const orderItemsTable = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  productImage: text("product_image").notNull().default(""),
  variantName: text("variant_name").notNull().default(""),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
});

export type OrderItemRow = typeof orderItemsTable.$inferSelect;
