import { Router, type IRouter } from "express";
import { db, storeSettingsTable, announcementTable, newsletterSubscribersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateStoreSettingsBody, SubscribeNewsletterBody } from "@workspace/api-zod";
import { serializeSettings } from "../lib/serializers";

const router: IRouter = Router();
const SETTINGS_ID = "default";
const ANNOUNCEMENT_ID = "default";

async function ensureSettings() {
  const rows = await db.select().from(storeSettingsTable).where(eq(storeSettingsTable.id, SETTINGS_ID)).limit(1);
  if (rows.length > 0) return rows[0];
  const [created] = await db
    .insert(storeSettingsTable)
    .values({ id: SETTINGS_ID })
    .returning();
  return created;
}

async function ensureAnnouncement() {
  const rows = await db.select().from(announcementTable).where(eq(announcementTable.id, ANNOUNCEMENT_ID)).limit(1);
  if (rows.length > 0) return rows[0];
  const [created] = await db
    .insert(announcementTable)
    .values({ id: ANNOUNCEMENT_ID, message: "", enabled: false })
    .returning();
  return created;
}

router.get("/store/settings", async (_req, res) => {
  const s = await ensureSettings();
  res.json(serializeSettings(s));
});

router.put("/store/settings", async (req, res) => {
  const body = UpdateStoreSettingsBody.parse(req.body ?? {});
  await ensureSettings();
  const [updated] = await db
    .update(storeSettingsTable)
    .set(body)
    .where(eq(storeSettingsTable.id, SETTINGS_ID))
    .returning();
  res.json(serializeSettings(updated));
});

router.get("/store/announcement", async (_req, res) => {
  const a = await ensureAnnouncement();
  res.json({ message: a.message, enabled: a.enabled });
});

router.post("/newsletter", async (req, res) => {
  const body = SubscribeNewsletterBody.parse(req.body ?? {});
  await db
    .insert(newsletterSubscribersTable)
    .values({ email: body.email })
    .onConflictDoNothing();
  res.json({ ok: true });
});

export default router;
