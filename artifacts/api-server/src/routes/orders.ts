import { Router, type IRouter } from "express";
import {
  db,
  ordersTable,
  orderItemsTable,
  cartsTable,
  cartItemsTable,
  discountsTable,
  productsTable,
} from "@workspace/db";
import { eq, sql, desc, like, inArray, and } from "drizzle-orm";
import {
  CheckoutBody,
  ListOrdersQueryParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";
import { newId, generateOrderNumber } from "../lib/ids";
import { serializeOrder } from "../lib/serializers";
import { loadCart } from "./cart";

const router: IRouter = Router();

router.post("/checkout", async (req, res) => {
  const body = CheckoutBody.parse(req.body ?? {});
  const cart = await loadCart(body.token);
  if (cart.items.length === 0) {
    res.status(400).json({ message: "Cart is empty" });
    return;
  }
  const orderId = newId("ord");
  const orderNumber = generateOrderNumber();
  await db.insert(ordersTable).values({
    id: orderId,
    orderNumber,
    status: "paid",
    email: body.email,
    customerName: body.shippingAddress.fullName,
    subtotal: String(cart.subtotal),
    discount: String(cart.discount),
    shipping: String(cart.shipping),
    tax: String(cart.tax),
    total: String(cart.total),
    currency: cart.currency,
    shippingAddress: body.shippingAddress,
  });
  if (cart.items.length > 0) {
    await db.insert(orderItemsTable).values(
      cart.items.map((item) => ({
        id: newId("oi"),
        orderId,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        variantName: item.variantName,
        unitPrice: String(item.unitPrice),
        quantity: item.quantity,
      })),
    );
    for (const item of cart.items) {
      await db
        .update(productsTable)
        .set({ unitsSold: sql`${productsTable.unitsSold} + ${item.quantity}` })
        .where(eq(productsTable.id, item.productId));
    }
  }
  if (cart.appliedDiscountCode) {
    await db
      .update(discountsTable)
      .set({ usageCount: sql`${discountsTable.usageCount} + 1` })
      .where(eq(discountsTable.code, cart.appliedDiscountCode));
  }
  await db.delete(cartItemsTable).where(eq(cartItemsTable.cartToken, body.token));
  await db.delete(cartsTable).where(eq(cartsTable.token, body.token));

  const orderRows = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  res.status(201).json(serializeOrder(orderRows[0], items));
});

router.get("/orders", async (req, res) => {
  const params = ListOrdersQueryParams.parse(req.query);
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  const conds = [];
  if (params.status) conds.push(eq(ordersTable.status, params.status));
  if (params.q) {
    const q = `%${params.q.toLowerCase()}%`;
    conds.push(
      sql`(lower(${ordersTable.email}) like ${q} or lower(${ordersTable.orderNumber}) like ${q} or lower(${ordersTable.customerName}) like ${q})`,
    );
  }
  const where = conds.length > 0 ? and(...conds) : sql`true`;
  const [orders, totalRow] = await Promise.all([
    db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<string>`count(*)` }).from(ordersTable).where(where),
  ]);
  const orderIds = orders.map((o) => o.id);
  const allItems = orderIds.length > 0
    ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orderIds))
    : [];
  const itemMap = new Map<string, typeof allItems>();
  for (const item of allItems) {
    if (!itemMap.has(item.orderId)) itemMap.set(item.orderId, []);
    itemMap.get(item.orderId)!.push(item);
  }
  res.json({
    items: orders.map((o) => serializeOrder(o, itemMap.get(o.id) ?? [])),
    total: Number(totalRow[0]?.count ?? 0),
  });
});

router.get("/orders/:id", async (req, res) => {
  const id = String(req.params.id);
  const rows = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json(serializeOrder(rows[0], items));
});

router.patch("/orders/:id", async (req, res) => {
  const id = String(req.params.id);
  const body = UpdateOrderStatusBody.parse(req.body ?? {});
  const [updated] = await db
    .update(ordersTable)
    .set({ status: body.status })
    .where(eq(ordersTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json(serializeOrder(updated, items));
});

export default router;
