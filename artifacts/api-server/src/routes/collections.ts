import { Router, type IRouter } from "express";
import { db, collectionsTable, productCollectionsTable, productsTable, reviewsTable } from "@workspace/db";
import { eq, sql, inArray } from "drizzle-orm";
import { CreateCollectionBody, UpdateCollectionBody } from "@workspace/api-zod";
import { newId, slugify } from "../lib/ids";
import { serializeCollection, serializeProduct } from "../lib/serializers";

const router: IRouter = Router();

router.get("/collections", async (_req, res) => {
  const colls = await db.select().from(collectionsTable);
  if (colls.length === 0) {
    res.json([]);
    return;
  }
  const counts = await db
    .select({
      collectionId: productCollectionsTable.collectionId,
      count: sql<string>`count(*)`,
    })
    .from(productCollectionsTable)
    .groupBy(productCollectionsTable.collectionId);
  const countMap = new Map(counts.map((c) => [c.collectionId, Number(c.count)]));
  res.json(colls.map((c) => serializeCollection(c, countMap.get(c.id) ?? 0)));
});

router.get("/collections/:slug", async (req, res) => {
  const slug = String(req.params.slug);
  const rows = await db.select().from(collectionsTable).where(eq(collectionsTable.slug, slug)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ message: "Collection not found" });
    return;
  }
  const coll = rows[0];
  const productIds = (
    await db
      .select({ id: productCollectionsTable.productId })
      .from(productCollectionsTable)
      .where(eq(productCollectionsTable.collectionId, coll.id))
  ).map((r) => r.id);
  const products = productIds.length > 0
    ? await db.select().from(productsTable).where(inArray(productsTable.id, productIds))
    : [];

  let ratings = new Map<string, { rating: number; count: number }>();
  if (products.length > 0) {
    const rows = await db
      .select({
        productId: reviewsTable.productId,
        avg: sql<string>`avg(${reviewsTable.rating})`,
        count: sql<string>`count(*)`,
      })
      .from(reviewsTable)
      .where(inArray(reviewsTable.productId, products.map((p) => p.id)))
      .groupBy(reviewsTable.productId);
    ratings = new Map(rows.map((r) => [r.productId, { rating: Number(r.avg), count: Number(r.count) }]));
  }

  res.json({
    ...serializeCollection(coll, products.length),
    products: products.map((p) => {
      const r = ratings.get(p.id);
      return serializeProduct(p, { rating: r?.rating ?? null, reviewCount: r?.count ?? 0 });
    }),
  });
});

router.post("/collections", async (req, res) => {
  const body = CreateCollectionBody.parse(req.body ?? {});
  const id = newId("col");
  const slug = body.slug ? slugify(body.slug) : `${slugify(body.name)}-${id.slice(-4)}`;
  const [created] = await db
    .insert(collectionsTable)
    .values({
      id,
      slug,
      name: body.name,
      description: body.description ?? "",
      imageUrl: body.imageUrl ?? "",
    })
    .returning();
  res.status(201).json(serializeCollection(created, 0));
});

router.put("/collections/id/:id", async (req, res) => {
  const id = String(req.params.id);
  const body = UpdateCollectionBody.parse(req.body ?? {});
  const updates: Record<string, unknown> = {};
  if (body.name != null) updates["name"] = body.name;
  if (body.slug != null) updates["slug"] = slugify(body.slug);
  if (body.description != null) updates["description"] = body.description;
  if (body.imageUrl != null) updates["imageUrl"] = body.imageUrl;
  let updated;
  if (Object.keys(updates).length > 0) {
    [updated] = await db.update(collectionsTable).set(updates).where(eq(collectionsTable.id, id)).returning();
  } else {
    [updated] = await db.select().from(collectionsTable).where(eq(collectionsTable.id, id));
  }
  if (!updated) {
    res.status(404).json({ message: "Collection not found" });
    return;
  }
  res.json(serializeCollection(updated));
});

router.delete("/collections/id/:id", async (req, res) => {
  const id = String(req.params.id);
  await db.delete(collectionsTable).where(eq(collectionsTable.id, id));
  res.status(204).send();
});

export default router;
