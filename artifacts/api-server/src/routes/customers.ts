import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { sql, like } from "drizzle-orm";
import { ListCustomersQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/customers", async (req, res) => {
  const params = ListCustomersQueryParams.parse(req.query);
  const where = params.q
    ? like(sql`lower(${ordersTable.email})`, `%${params.q.toLowerCase()}%`)
    : sql`true`;
  const rows = await db
    .select({
      email: ordersTable.email,
      name: sql<string>`max(${ordersTable.customerName})`,
      orderCount: sql<string>`count(*)`,
      totalSpent: sql<string>`sum(${ordersTable.total})`,
      currency: sql<string>`max(${ordersTable.currency})`,
      lastOrderAt: sql<string>`max(${ordersTable.createdAt})`,
    })
    .from(ordersTable)
    .where(where)
    .groupBy(ordersTable.email);

  res.json(
    rows.map((r) => ({
      email: r.email,
      name: r.name ?? "",
      orderCount: Number(r.orderCount),
      totalSpent: Number(r.totalSpent ?? 0),
      currency: r.currency ?? "USD",
      lastOrderAt: r.lastOrderAt,
    })),
  );
});

export default router;
