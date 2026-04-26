import type {
  ProductRow,
  CollectionRow,
  ReviewRow,
  CartRow,
  CartItemRow,
  OrderRow,
  OrderItemRow,
  DiscountRow,
  StoreSettingsRow,
} from "@workspace/db";

const num = (s: string | null | undefined): number => (s == null ? 0 : Number(s));

export function serializeProduct(
  p: ProductRow,
  extras?: { rating?: number | null; reviewCount?: number },
) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: num(p.price),
    compareAtPrice: p.compareAtPrice == null ? null : num(p.compareAtPrice),
    currency: p.currency,
    images: p.images ?? [],
    tags: p.tags ?? [],
    inStock: p.inStock,
    featured: p.featured,
    createdAt: p.createdAt.toISOString(),
    rating: extras?.rating ?? null,
    reviewCount: extras?.reviewCount ?? 0,
  };
}

export function serializeProductDetail(
  p: ProductRow,
  collections: CollectionRow[],
  extras?: { rating?: number | null; reviewCount?: number },
) {
  return {
    ...serializeProduct(p, extras),
    fullDescription: p.fullDescription,
    variants: p.variants ?? [],
    collections: collections.map(serializeCollection),
  };
}

export function serializeCollection(
  c: CollectionRow,
  productCount = 0,
) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl,
    productCount,
  };
}

export function serializeReview(r: ReviewRow) {
  return {
    id: r.id,
    productId: r.productId,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
  };
}

export function serializeCartItem(
  item: CartItemRow,
  product: { name: string; images: string[]; slug: string },
) {
  const unitPrice = num(item.unitPrice);
  return {
    id: item.id,
    productId: item.productId,
    productName: product.name,
    productImage: product.images?.[0] ?? "",
    productSlug: product.slug,
    variantName: item.variantName,
    unitPrice,
    quantity: item.quantity,
    lineTotal: unitPrice * item.quantity,
  };
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

export function computeCartTotals(
  items: { unitPrice: number; quantity: number; lineTotal: number }[],
  discountValue: number,
  currency: string,
): CartTotals {
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const discount = Math.min(discountValue, subtotal);
  const shipping = subtotal > 0 && subtotal - discount < 100 ? 9.95 : 0;
  const tax = round2((subtotal - discount) * 0.08);
  const total = round2(subtotal - discount + shipping + tax);
  return {
    subtotal: round2(subtotal),
    discount: round2(discount),
    shipping: round2(shipping),
    tax,
    total,
    itemCount,
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function serializeCart(
  cart: CartRow,
  items: ReturnType<typeof serializeCartItem>[],
  totals: CartTotals,
  currency: string,
) {
  return {
    token: cart.token,
    items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    tax: totals.tax,
    total: totals.total,
    currency,
    itemCount: totals.itemCount,
    appliedDiscountCode: cart.appliedDiscountCode,
  };
}

export function serializeOrder(o: OrderRow, items: OrderItemRow[]) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    email: o.email,
    customerName: o.customerName,
    items: items.map((it) => ({
      id: it.id,
      productName: it.productName,
      productImage: it.productImage,
      variantName: it.variantName,
      unitPrice: num(it.unitPrice),
      quantity: it.quantity,
      lineTotal: num(it.unitPrice) * it.quantity,
    })),
    subtotal: num(o.subtotal),
    discount: num(o.discount),
    shipping: num(o.shipping),
    tax: num(o.tax),
    total: num(o.total),
    currency: o.currency,
    shippingAddress: o.shippingAddress,
    createdAt: o.createdAt.toISOString(),
  };
}

export function serializeDiscount(d: DiscountRow) {
  return {
    id: d.id,
    code: d.code,
    type: d.type,
    value: num(d.value),
    minSubtotal: d.minSubtotal == null ? null : num(d.minSubtotal),
    active: d.active,
    usageCount: d.usageCount,
    usageLimit: d.usageLimit,
    expiresAt: d.expiresAt ? d.expiresAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  };
}

export function serializeSettings(s: StoreSettingsRow) {
  return {
    id: s.id,
    name: s.name,
    tagline: s.tagline,
    currency: s.currency,
    primaryColor: s.primaryColor,
    accentColor: s.accentColor,
    logoUrl: s.logoUrl,
    heroTitle: s.heroTitle,
    heroSubtitle: s.heroSubtitle,
    heroImageUrl: s.heroImageUrl,
    contactEmail: s.contactEmail,
    instagramUrl: s.instagramUrl,
    twitterUrl: s.twitterUrl,
    footerText: s.footerText,
  };
}
