import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const collectionsTable = pgTable("collections", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CollectionRow = typeof collectionsTable.$inferSelect;
