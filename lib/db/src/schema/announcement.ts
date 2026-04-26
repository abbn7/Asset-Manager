import { pgTable, text, boolean } from "drizzle-orm/pg-core";

export const announcementTable = pgTable("announcement", {
  id: text("id").primaryKey(),
  message: text("message").notNull().default(""),
  enabled: boolean("enabled").notNull().default(false),
});
