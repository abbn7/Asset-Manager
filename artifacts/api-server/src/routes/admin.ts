import { Router, type IRouter } from "express";
import {
  db,
  ordersTable,
  orderItemsTable,
  productsTable,
  reviewsTable,
} from "@workspace/db";
import { sql, desc, gte, eq, inArray } from "drizzle-orm";
import {
  GetRevenueAnalyticsQueryParams,
  GetTopProductsQueryParams,
  GetRecentAdminActivityQueryParams,
} from "@workspace/api-zod";
import { serializeOrder } from "../lib/serializers";

const router: IRouter = Router();

router.get("/admin/dashboard", async (_req, res) => {
  const now = new Date();
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const day60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [allOrders, last30, prev30, productsCount, customersCount, recentOrders, lowStock] = await Promise.all([
    db
      .select({
        revenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)`,
        orders: sql<string>`count(*)`,
      })
      .from(ordersTable),
    db
      .select({
        revenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)`,
        orders: sql<string>`count(*)`,
      })
      .from(ordersTable)
      .where(gte(ordersTable.createdAt, day30)),
    db
      .select({
        revenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)`,
        orders: sql<string>`count(*)`,
      })
      .from(ordersTable)
      .where(sql`${ordersTable.createdAt} >= ${day60} and ${ordersTable.createdAt} < ${day30}`),
    db.select({ count: sql<string>`count(*)` }).from(productsTable),
    db.select({ count: sql<string>`count(distinct ${ordersTable.email})` }).from(ordersTable),
    db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(5),
    db.select({ count: sql<string>`count(*)` }).from(productsTable).where(eq(productsTable.inStock, false)),
  ]);

  const recentIds = recentOrders.map((o) => o.id);
  const recentItems = recentIds.length > 0
    ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, recentIds))
    : [];
  const itemMap = new Map<string, typeof recentItems>();
  for (const item of recentItems) {
    if (!itemMap.has(item.orderId)) itemMap.set(item.orderId, []);
    itemMap.get(item.orderId)!.push(item);
  }

  const totalRevenue = Number(allOrders[0]?.revenue ?? 0);
  const last30Rev = Number(last30[0]?.revenue ?? 0);
  const prev30Rev = Number(prev30[0]?.revenue ?? 0);
  const last30Ord = Number(last30[0]?.orders ?? 0);
  const prev30Ord = Number(prev30[0]?.orders ?? 0);

  const revenueChangePct = prev30Rev > 0 ? Math.round(((last30Rev - prev30Rev) / prev30Rev) * 100) : (last30Rev > 0 ? 100 : 0);
  const ordersChangePct = prev30Ord > 0 ? Math.round(((last30Ord - prev30Ord) / prev30Ord) * 100) : (last30Ord > 0 ? 100 : 0);

  res.json({
    totalRevenue,
    totalOrders: Number(allOrders[0]?.orders ?? 0),
    totalCustomers: Number(customersCount[0]?.count ?? 0),
    totalProducts: Number(productsCount[0]?.count ?? 0),
    currency: "USD",
    revenueChangePct,
    ordersChangePct,
    lowStockCount: Number(lowStock[0]?.count ?? 0),
    recentOrders: recentOrders.map((o) => serializeOrder(o, itemMap.get(o.id) ?? [])),
  });
});

router.get("/admin/analytics/revenue", async (req, res) => {
  const params = GetRevenueAnalyticsQueryParams.parse(req.query);
  const range = params.range ?? "30d";
  const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "12m" ? 365 : 30;
  const groupByMonth = range === "12m";
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = groupByMonth
    ? await db
        .select({
          bucket: sql<string>`to_char(${ordersTable.createdAt}, 'YYYY-MM')`,
          revenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)`,
          orders: sql<string>`count(*)`,
        })
        .from(ordersTable)
        .where(gte(ordersTable.createdAt, start))
        .groupBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM')`)
    : await db
        .select({
          bucket: sql<string>`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`,
          revenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)`,
          orders: sql<string>`count(*)`,
        })
        .from(ordersTable)
        .where(gte(ordersTable.createdAt, start))
        .groupBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`);

  const points: { date: string; revenue: number; orders: number }[] = [];
  const map = new Map(rows.map((r) => [r.bucket, r]));

  if (groupByMonth) {
    const cur = new Date();
    cur.setUTCDate(1);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(cur.getFullYear(), cur.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const r = map.get(key);
      points.push({
        date: key,
        revenue: Number(r?.revenue ?? 0),
        orders: Number(r?.orders ?? 0),
      });
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const r = map.get(key);
      points.push({
        date: key,
        revenue: Number(r?.revenue ?? 0),
        orders: Number(r?.orders ?? 0),
      });
    }
  }

  const totals = points.reduce(
    (acc, p) => ({ revenue: acc.revenue + p.revenue, orders: acc.orders + p.orders }),
    { revenue: 0, orders: 0 },
  );

  res.json({
    points,
    totalRevenue: totals.revenue,
    totalOrders: totals.orders,
    currency: "USD",
  });
});

router.get("/admin/analytics/top-products", async (req, res) => {
  const params = GetTopProductsQueryParams.parse(req.query);
  const limit = params.limit ?? 5;
  const rows = await db
    .select({
      productId: orderItemsTable.productId,
      name: sql<string>`max(${orderItemsTable.productName})`,
      image: sql<string>`max(${orderItemsTable.productImage})`,
      unitsSold: sql<string>`coalesce(sum(${orderItemsTable.quantity}), 0)`,
      revenue: sql<string>`coalesce(sum(${orderItemsTable.unitPrice} * ${orderItemsTable.quantity}), 0)`,
    })
    .from(orderItemsTable)
    .groupBy(orderItemsTable.productId)
    .orderBy(desc(sql`coalesce(sum(${orderItemsTable.unitPrice} * ${orderItemsTable.quantity}), 0)`))
    .limit(limit);
  res.json(rows.map((r) => ({
    productId: r.productId,
    name: r.name,
    image: r.image,
    unitsSold: Number(r.unitsSold),
    revenue: Number(r.revenue),
    currency: "USD",
  })));
});

router.get("/admin/activity", async (req, res) => {
  const params = GetRecentAdminActivityQueryParams.parse(req.query);
  const limit = params.limit ?? 20;

  const [orders, products, reviews] = await Promise.all([
    db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(limit),
    db.select().from(productsTable).orderBy(desc(productsTable.createdAt)).limit(limit),
    db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt)).limit(limit),
  ]);

  type Event = { id: string; type: "order" | "product" | "customer" | "review"; message: string; createdAt: string };
  const events: Event[] = [];
  for (const o of orders) {
    events.push({
      id: `evt_${o.id}`,
      type: "order",
      message: `New order ${o.orderNumber} from ${o.customerName || o.email}`,
      createdAt: o.createdAt.toISOString(),
    });
  }
  for (const p of products) {
    events.push({
      id: `evt_${p.id}`,
      type: "product",
      message: `Product added: ${p.name}`,
      createdAt: p.createdAt.toISOString(),
    });
  }
  for (const r of reviews) {
    events.push({
      id: `evt_${r.id}`,
      type: "review",
      message: `${r.authorName} left a ${r.rating}-star review`,
      createdAt: r.createdAt.toISOString(),
    });
  }
  events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(events.slice(0, limit));
});

export default router;
