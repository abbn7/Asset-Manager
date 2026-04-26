import { Router, type IRouter } from "express";
import { db, cartsTable, cartItemsTable, productsTable, discountsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import {
  AddToCartBody,
  UpdateCartItemBody,
  ApplyDiscountToCartBody,
} from "@workspace/api-zod";
import { newId } from "../lib/ids";
import { computeCartTotals, serializeCart, serializeCartItem } from "../lib/serializers";

const router: IRouter = Router();

async function ensureCart(token: string) {
  const rows = await db.select().from(cartsTable).where(eq(cartsTable.token, token)).limit(1);
  if (rows.length > 0) return rows[0];
  const [created] = await db.insert(cartsTable).values({ token }).returning();
  return created;
}

async function getDiscountValue(code: string | null, subtotal: number): Promise<number> {
  if (!code) return 0;
  const rows = await db.select().from(discountsTable).where(eq(discountsTable.code, code.toUpperCase())).limit(1);
  if (rows.length === 0) return 0;
  const d = rows[0];
  if (!d.active) return 0;
  if (d.expiresAt && d.expiresAt.getTime() < Date.now()) return 0;
  if (d.minSubtotal != null && subtotal < Number(d.minSubtotal)) return 0;
  if (d.type === "percentage") return Math.round(subtotal * (Number(d.value) / 100) * 100) / 100;
  return Math.min(subtotal, Number(d.value));
}

async function loadCart(token: string) {
  const cart = await ensureCart(token);
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.cartToken, token));
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = productIds.length > 0
    ? await db.select().from(productsTable).where(inArray(productsTable.id, productIds))
    : [];
  const pmap = new Map(products.map((p) => [p.id, p]));
  const serialized = items
    .map((item) => {
      const p = pmap.get(item.productId);
      if (!p) return null;
      return serializeCartItem(item, { name: p.name, images: p.images ?? [], slug: p.slug });
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotalForDiscount = serialized.reduce((s, i) => s + i.lineTotal, 0);
  const discountValue = await getDiscountValue(cart.appliedDiscountCode, subtotalForDiscount);
  const totals = computeCartTotals(serialized, discountValue, "USD");
  const currency = products[0]?.currency ?? "USD";
  return serializeCart(cart, serialized, totals, currency);
}

router.get("/cart", async (req, res) => {
  const token = String(req.query.token ?? "");
  if (!token) {
    res.json({
      token: "",
      items: [],
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      currency: "USD",
      itemCount: 0,
      appliedDiscountCode: null,
    });
    return;
  }
  res.json(await loadCart(token));
});

router.post("/cart", async (req, res) => {
  const body = AddToCartBody.parse(req.body ?? {});
  const token = body.token && body.token.length > 0 ? body.token : newId("cart");
  await ensureCart(token);
  const productRows = await db.select().from(productsTable).where(eq(productsTable.id, body.productId)).limit(1);
  if (productRows.length === 0) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  const product = productRows[0];
  const variantName = body.variantName ?? "";
  const existing = await db
    .select()
    .from(cartItemsTable)
    .where(
      and(
        eq(cartItemsTable.cartToken, token),
        eq(cartItemsTable.productId, body.productId),
        eq(cartItemsTable.variantName, variantName),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(cartItemsTable)
      .set({ quantity: existing[0].quantity + body.quantity })
      .where(eq(cartItemsTable.id, existing[0].id));
  } else {
    await db.insert(cartItemsTable).values({
      id: newId("ci"),
      cartToken: token,
      productId: body.productId,
      variantName,
      unitPrice: product.price,
      quantity: body.quantity,
    });
  }
  res.json(await loadCart(token));
});

router.patch("/cart/items/:itemId", async (req, res) => {
  const itemId = String(req.params.itemId);
  const body = UpdateCartItemBody.parse(req.body ?? {});
  if (body.quantity <= 0) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  } else {
    await db
      .update(cartItemsTable)
      .set({ quantity: body.quantity })
      .where(eq(cartItemsTable.id, itemId));
  }
  res.json(await loadCart(body.token));
});

router.delete("/cart/items/:itemId", async (req, res) => {
  const itemId = String(req.params.itemId);
  const token = String(req.query.token ?? "");
  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  res.json(await loadCart(token));
});

router.post("/cart/apply-discount", async (req, res) => {
  const body = ApplyDiscountToCartBody.parse(req.body ?? {});
  await ensureCart(body.token);
  const code = body.code.trim().toUpperCase();
  await db.update(cartsTable).set({ appliedDiscountCode: code }).where(eq(cartsTable.token, body.token));
  res.json(await loadCart(body.token));
});

export { loadCart };
export default router;
