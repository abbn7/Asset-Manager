import { pgTable, text, primaryKey } from "drizzle-orm/pg-core";
import { productsTable } from "./products";
import { collectionsTable } from "./collections";

export const productCollectionsTable = pgTable(
  "product_collections",
  {
    productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
    collectionId: text("collection_id").notNull().references(() => collectionsTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.collectionId] })],
);
