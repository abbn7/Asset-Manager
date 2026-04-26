import { pgTable, text, integer, numeric } from "drizzle-orm/pg-core";
import { cartsTable } from "./carts";
import { productsTable } from "./products";

export const cartItemsTable = pgTable("cart_items", {
  id: text("id").primaryKey(),
  cartToken: text("cart_token").notNull().references(() => cartsTable.token, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  variantName: text("variant_name").notNull().default(""),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export type CartItemRow = typeof cartItemsTable.$inferSelect;
