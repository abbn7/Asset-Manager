import { Router, type IRouter } from "express";
import { db, discountsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateDiscountBody, ValidateDiscountCodeBody } from "@workspace/api-zod";
import { newId } from "../lib/ids";
import { serializeDiscount } from "../lib/serializers";

const router: IRouter = Router();

router.get("/discounts", async (_req, res) => {
  const rows = await db.select().from(discountsTable).orderBy(desc(discountsTable.createdAt));
  res.json(rows.map(serializeDiscount));
});

router.post("/discounts", async (req, res) => {
  const body = CreateDiscountBody.parse(req.body ?? {});
  const [created] = await db
    .insert(discountsTable)
    .values({
      id: newId("disc"),
      code: body.code.toUpperCase().trim(),
      type: body.type,
      value: String(body.value),
      minSubtotal: body.minSubtotal != null ? String(body.minSubtotal) : null,
      usageLimit: body.usageLimit ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      active: true,
    })
    .returning();
  res.status(201).json(serializeDiscount(created));
});

router.delete("/discounts/:id", async (req, res) => {
  const id = String(req.params.id);
  await db.delete(discountsTable).where(eq(discountsTable.id, id));
  res.status(204).send();
});

router.post("/discounts/validate", async (req, res) => {
  const body = ValidateDiscountCodeBody.parse(req.body ?? {});
  const rows = await db.select().from(discountsTable).where(eq(discountsTable.code, body.code.toUpperCase().trim())).limit(1);
  if (rows.length === 0) {
    res.json({ valid: false, message: "Code not found" });
    return;
  }
  const d = rows[0];
  if (!d.active) {
    res.json({ valid: false, message: "Code inactive" });
    return;
  }
  if (d.expiresAt && d.expiresAt.getTime() < Date.now()) {
    res.json({ valid: false, message: "Code expired" });
    return;
  }
  if (d.minSubtotal != null && body.subtotal < Number(d.minSubtotal)) {
    res.json({ valid: false, message: `Minimum subtotal of ${d.minSubtotal} required` });
    return;
  }
  if (d.usageLimit != null && d.usageCount >= d.usageLimit) {
    res.json({ valid: false, message: "Usage limit reached" });
    return;
  }
  const discountAmount = d.type === "percentage"
    ? Math.round(body.subtotal * (Number(d.value) / 100) * 100) / 100
    : Math.min(body.subtotal, Number(d.value));
  res.json({
    valid: true,
    code: d.code,
    discountAmount,
    message: d.type === "percentage" ? `${d.value}% off` : `${d.value} off`,
  });
});

export default router;
