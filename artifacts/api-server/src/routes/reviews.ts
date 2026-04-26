import { Router, type IRouter } from "express";
import { db, reviewsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateReviewBody } from "@workspace/api-zod";
import { newId } from "../lib/ids";
import { serializeReview } from "../lib/serializers";

const router: IRouter = Router();

router.get("/reviews", async (req, res) => {
  const productId = String(req.query.productId ?? "");
  if (!productId) {
    res.json([]);
    return;
  }
  const rows = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, productId))
    .orderBy(desc(reviewsTable.createdAt));
  res.json(rows.map(serializeReview));
});

router.post("/reviews", async (req, res) => {
  const body = CreateReviewBody.parse(req.body ?? {});
  const [created] = await db
    .insert(reviewsTable)
    .values({
      id: newId("rev"),
      productId: body.productId,
      authorName: body.authorName,
      rating: body.rating,
      title: body.title,
      body: body.body,
    })
    .returning();
  res.status(201).json(serializeReview(created));
});

export default router;
