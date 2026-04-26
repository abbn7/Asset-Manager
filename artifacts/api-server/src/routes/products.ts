import { Router, type IRouter } from "express";
import {
  db,
  productsTable,
  collectionsTable,
  productCollectionsTable,
  reviewsTable,
} from "@workspace/db";
import { and, asc, desc, eq, gte, lte, like, or, sql, inArray } from "drizzle-orm";
import {
  ListProductsQueryParams,
  CreateProductBody,
  UpdateProductBody,
  ListFeaturedProductsQueryParams,
  ListNewArrivalsQueryParams,
  ListBestSellersQueryParams,
  ListRelatedProductsParams,
  ListRelatedProductsQueryParams,
} from "@workspace/api-zod";
import { newId, slugify } from "../lib/ids";
import { serializeProduct, serializeProductDetail, serializeCollection } from "../lib/serializers";

const router: IRouter = Router();

async function getRatings(productIds: string[]): Promise<Map<string, { rating: number; count: number }>> {
  const map = new Map<string, { rating: number; count: number }>();
  if (productIds.length === 0) return map;
  const rows = await db
    .select({
      productId: reviewsTable.productId,
      avg: sql<string>`avg(${reviewsTable.rating})`,
      count: sql<string>`count(*)`,
    })
    .from(reviewsTable)
    .where(inArray(reviewsTable.productId, productIds))
    .groupBy(reviewsTable.productId);
  for (const r of rows) {
    map.set(r.productId, { rating: Number(r.avg), count: Number(r.count) });
  }
  return map;
}

router.get("/products", async (req, res) => {
  const params = ListProductsQueryParams.parse(req.query);
  const conds = [];
  if (params.q) conds.push(like(sql`lower(${productsTable.name})`, `%${params.q.toLowerCase()}%`));
  if (params.tag) conds.push(sql`${productsTable.tags} @> ${JSON.stringify([params.tag])}::jsonb`);
  if (params.minPrice != null) conds.push(gte(productsTable.price, String(params.minPrice)));
  if (params.maxPrice != null) conds.push(lte(productsTable.price, String(params.maxPrice)));

  let productIdsByCollection: string[] | null = null;
  if (params.collection) {
    const coll = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.slug, params.collection))
      .limit(1);
    if (coll.length === 0) {
      res.json({ items: [], total: 0 });
      return;
    }
    const ids = await db
      .select({ id: productCollectionsTable.productId })
      .from(productCollectionsTable)
      .where(eq(productCollectionsTable.collectionId, coll[0].id));
    productIdsByCollection = ids.map((r) => r.id);
    if (productIdsByCollection.length === 0) {
      res.json({ items: [], total: 0 });
      return;
    }
    conds.push(inArray(productsTable.id, productIdsByCollection));
  }

  const where = conds.length > 0 ? and(...conds) : undefined;

  const order = (() => {
    switch (params.sort) {
      case "price_asc": return asc(productsTable.price);
      case "price_desc": return desc(productsTable.price);
      case "popular": return desc(productsTable.unitsSold);
      case "name_asc": return asc(productsTable.name);
      case "newest":
      default: return desc(productsTable.createdAt);
    }
  })();

  const limit = params.limit ?? 24;
  const offset = params.offset ?? 0;

  const [items, totalRow] = await Promise.all([
    db.select().from(productsTable).where(where ?? sql`true`).orderBy(order).limit(limit).offset(offset),
    db.select({ count: sql<string>`count(*)` }).from(productsTable).where(where ?? sql`true`),
  ]);

  const ratings = await getRatings(items.map((p) => p.id));
  res.json({
    items: items.map((p) => {
      const r = ratings.get(p.id);
      return serializeProduct(p, { rating: r?.rating ?? null, reviewCount: r?.count ?? 0 });
    }),
    total: Number(totalRow[0]?.count ?? 0),
  });
});

router.get("/products/featured", async (req, res) => {
  const params = ListFeaturedProductsQueryParams.parse(req.query);
  const limit = params.limit ?? 8;
  const items = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.featured, true))
    .orderBy(desc(productsTable.createdAt))
    .limit(limit);
  const ratings = await getRatings(items.map((p) => p.id));
  res.json(items.map((p) => {
    const r = ratings.get(p.id);
    return serializeProduct(p, { rating: r?.rating ?? null, reviewCount: r?.count ?? 0 });
  }));
});

router.get("/products/new-arrivals", async (req, res) => {
  const params = ListNewArrivalsQueryParams.parse(req.query);
  const limit = params.limit ?? 8;
  const items = await db
    .select()
    .from(productsTable)
    .orderBy(desc(productsTable.createdAt))
    .limit(limit);
  const ratings = await getRatings(items.map((p) => p.id));
  res.json(items.map((p) => {
    const r = ratings.get(p.id);
    return serializeProduct(p, { rating: r?.rating ?? null, reviewCount: r?.count ?? 0 });
  }));
});

router.get("/products/best-sellers", async (req, res) => {
  const params = ListBestSellersQueryParams.parse(req.query);
  const limit = params.limit ?? 8;
  const items = await db
    .select()
    .from(productsTable)
    .orderBy(desc(productsTable.unitsSold))
    .limit(limit);
  const ratings = await getRatings(items.map((p) => p.id));
  res.json(items.map((p) => {
    const r = ratings.get(p.id);
    return serializeProduct(p, { rating: r?.rating ?? null, reviewCount: r?.count ?? 0 });
  }));
});

router.get("/products/:slug", async (req, res) => {
  const slug = String(req.params.slug);
  const rows = await db.select().from(productsTable).where(eq(productsTable.slug, slug)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  const product = rows[0];
  const collIdsRows = await db
    .select({ id: productCollectionsTable.collectionId })
    .from(productCollectionsTable)
    .where(eq(productCollectionsTable.productId, product.id));
  const collIds = collIdsRows.map((r) => r.id);
  const collections = collIds.length > 0
    ? await db.select().from(collectionsTable).where(inArray(collectionsTable.id, collIds))
    : [];
  const ratings = await getRatings([product.id]);
  const r = ratings.get(product.id);
  res.json(
    serializeProductDetail(product, collections, {
      rating: r?.rating ?? null,
      reviewCount: r?.count ?? 0,
    }),
  );
});

router.get("/products/:slug/related", async (req, res) => {
  const { slug } = ListRelatedProductsParams.parse(req.params);
  const params = ListRelatedProductsQueryParams.parse(req.query);
  const limit = params.limit ?? 4;
  const productRows = await db.select().from(productsTable).where(eq(productsTable.slug, slug)).limit(1);
  if (productRows.length === 0) {
    res.json([]);
    return;
  }
  const product = productRows[0];
  const collIds = (
    await db
      .select({ id: productCollectionsTable.collectionId })
      .from(productCollectionsTable)
      .where(eq(productCollectionsTable.productId, product.id))
  ).map((r) => r.id);

  let related: typeof productRows = [];
  if (collIds.length > 0) {
    const relIds = (
      await db
        .select({ id: productCollectionsTable.productId })
        .from(productCollectionsTable)
        .where(inArray(productCollectionsTable.collectionId, collIds))
    ).map((r) => r.id).filter((id) => id !== product.id);
    if (relIds.length > 0) {
      related = await db
        .select()
        .from(productsTable)
        .where(inArray(productsTable.id, relIds))
        .limit(limit);
    }
  }
  if (related.length < limit) {
    const extra = await db
      .select()
      .from(productsTable)
      .where(sql`${productsTable.id} != ${product.id}`)
      .orderBy(desc(productsTable.createdAt))
      .limit(limit - related.length);
    const seen = new Set(related.map((r) => r.id));
    for (const p of extra) {
      if (!seen.has(p.id)) {
        related.push(p);
        seen.add(p.id);
      }
    }
  }
  const ratings = await getRatings(related.map((p) => p.id));
  res.json(related.slice(0, limit).map((p) => {
    const r = ratings.get(p.id);
    return serializeProduct(p, { rating: r?.rating ?? null, reviewCount: r?.count ?? 0 });
  }));
});

router.get("/products/id/:id", async (req, res) => {
  const id = String(req.params.id);
  const rows = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  const product = rows[0];
  const collIdsRows = await db
    .select({ id: productCollectionsTable.collectionId })
    .from(productCollectionsTable)
    .where(eq(productCollectionsTable.productId, product.id));
  const collIds = collIdsRows.map((r) => r.id);
  const collections = collIds.length > 0
    ? await db.select().from(collectionsTable).where(inArray(collectionsTable.id, collIds))
    : [];
  const ratings = await getRatings([product.id]);
  const r = ratings.get(product.id);
  res.json(serializeProductDetail(product, collections, {
    rating: r?.rating ?? null,
    reviewCount: r?.count ?? 0,
  }));
});

router.post("/products", async (req, res) => {
  const body = CreateProductBody.parse(req.body ?? {});
  const id = newId("prod");
  const slug = body.slug ? slugify(body.slug) : `${slugify(body.name)}-${id.slice(-4)}`;
  const [inserted] = await db
    .insert(productsTable)
    .values({
      id,
      slug,
      name: body.name,
      description: body.description ?? "",
      fullDescription: body.fullDescription ?? "",
      price: String(body.price),
      compareAtPrice: body.compareAtPrice != null ? String(body.compareAtPrice) : null,
      currency: body.currency ?? "USD",
      images: body.images ?? [],
      tags: body.tags ?? [],
      inStock: body.inStock ?? true,
      featured: body.featured ?? false,
    })
    .returning();
  if (body.collectionIds && body.collectionIds.length > 0) {
    await db.insert(productCollectionsTable).values(
      body.collectionIds.map((cid) => ({ productId: id, collectionId: cid })),
    ).onConflictDoNothing();
  }
  res.status(201).json(serializeProduct(inserted));
});

router.put("/products/id/:id", async (req, res) => {
  const id = String(req.params.id);
  const body = UpdateProductBody.parse(req.body ?? {});
  const updates: Record<string, unknown> = {};
  if (body.name != null) updates["name"] = body.name;
  if (body.slug != null) updates["slug"] = slugify(body.slug);
  if (body.description != null) updates["description"] = body.description;
  if (body.fullDescription != null) updates["fullDescription"] = body.fullDescription;
  if (body.price != null) updates["price"] = String(body.price);
  if (body.compareAtPrice !== undefined) {
    updates["compareAtPrice"] = body.compareAtPrice == null ? null : String(body.compareAtPrice);
  }
  if (body.currency != null) updates["currency"] = body.currency;
  if (body.images != null) updates["images"] = body.images;
  if (body.tags != null) updates["tags"] = body.tags;
  if (body.inStock != null) updates["inStock"] = body.inStock;
  if (body.featured != null) updates["featured"] = body.featured;

  let updated;
  if (Object.keys(updates).length > 0) {
    [updated] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  } else {
    [updated] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  }
  if (!updated) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  if (body.collectionIds != null) {
    await db.delete(productCollectionsTable).where(eq(productCollectionsTable.productId, id));
    if (body.collectionIds.length > 0) {
      await db.insert(productCollectionsTable).values(
        body.collectionIds.map((cid) => ({ productId: id, collectionId: cid })),
      ).onConflictDoNothing();
    }
  }
  res.json(serializeProduct(updated));
});

router.delete("/products/id/:id", async (req, res) => {
  const id = String(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).send();
});

router.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase().trim();
  if (!q) {
    res.json({ products: [], collections: [] });
    return;
  }
  const [products, collections] = await Promise.all([
    db
      .select()
      .from(productsTable)
      .where(
        or(
          like(sql`lower(${productsTable.name})`, `%${q}%`),
          like(sql`lower(${productsTable.description})`, `%${q}%`),
        ),
      )
      .limit(10),
    db
      .select()
      .from(collectionsTable)
      .where(
        or(
          like(sql`lower(${collectionsTable.name})`, `%${q}%`),
          like(sql`lower(${collectionsTable.description})`, `%${q}%`),
        ),
      )
      .limit(5),
  ]);
  const ratings = await getRatings(products.map((p) => p.id));
  res.json({
    products: products.map((p) => {
      const r = ratings.get(p.id);
      return serializeProduct(p, { rating: r?.rating ?? null, reviewCount: r?.count ?? 0 });
    }),
    collections: collections.map((c) => serializeCollection(c)),
  });
});

export default router;
