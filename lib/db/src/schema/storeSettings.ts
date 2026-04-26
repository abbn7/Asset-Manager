import { pgTable, text } from "drizzle-orm/pg-core";

export const storeSettingsTable = pgTable("store_settings", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("Maison"),
  tagline: text("tagline").notNull().default(""),
  currency: text("currency").notNull().default("USD"),
  primaryColor: text("primary_color").notNull().default("#1a1a1a"),
  accentColor: text("accent_color").notNull().default("#c8a97e"),
  logoUrl: text("logo_url").notNull().default(""),
  heroTitle: text("hero_title").notNull().default(""),
  heroSubtitle: text("hero_subtitle").notNull().default(""),
  heroImageUrl: text("hero_image_url").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  twitterUrl: text("twitter_url").notNull().default(""),
  footerText: text("footer_text").notNull().default(""),
});

export type StoreSettingsRow = typeof storeSettingsTable.$inferSelect;
