import { useParams, Link } from "wouter";
import { useGetOrderById } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Confirmed",
  fulfilled: "Shipped",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default function OrderDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { data: order, isLoading } = useGetOrderById(id, { query: { enabled: !!id } as never });

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <Skeleton className="h-12 w-1/2 mb-8 rounded-none" />
        <Skeleton className="h-64 rounded-none" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="container mx-auto px-6 py-32 text-center">
        <h2 className="font-serif text-3xl mb-4">Order not found</h2>
        <Button asChild variant="outline" className="rounded-none">
          <Link href="/orders">View your orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-16 max-w-3xl">
      <div className="text-center mb-12">
        <div className="h-14 w-14 rounded-full border border-primary/40 bg-primary/10 mx-auto flex items-center justify-center mb-6">
          <Check className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </div>
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Confirmed
        </span>
        <h1 className="font-serif text-4xl md:text-5xl mt-4 mb-3">Thank you</h1>
        <p className="text-muted-foreground">
          Your order <span className="text-foreground font-medium">{order.orderNumber}</span> has been received.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          A confirmation has been sent to {order.email}.
        </p>
      </div>

      <div className="bg-muted/40 p-8 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Status
          </span>
          <span className="text-xs uppercase tracking-widest font-medium">
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Placed
          </span>
          <span className="text-xs">{formatDate(order.createdAt)}</span>
        </div>
      </div>

      <h3 className="font-serif text-2xl mb-4">Items</h3>
      <div className="space-y-4 mb-8">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4 pb-4 border-b border-border">
            <div className="w-20 h-24 bg-muted overflow-hidden shrink-0">
              {item.productImage && (
                <img
                  src={item.productImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">{item.productName}</div>
              {item.variantName && (
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                  {item.variantName}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">Qty {item.quantity}</div>
            </div>
            <span className="font-medium">
              {formatMoney(item.lineTotal, order.currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h4 className="text-xs uppercase tracking-widest font-medium mb-3">
            Shipping
          </h4>
          <address className="not-italic text-sm leading-relaxed">
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 && (
              <>
                <br />
                {order.shippingAddress.line2}
              </>
            )}
            <br />
            {order.shippingAddress.city}
            {order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ""}{" "}
            {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.country}
          </address>
        </div>
        <div className="bg-muted/40 p-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(order.subtotal, order.currency)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-primary">
              <span>Discount</span>
              <span>−{formatMoney(order.discount, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{order.shipping === 0 ? "Free" : formatMoney(order.shipping, order.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatMoney(order.tax, order.currency)}</span>
          </div>
          <div className="flex justify-between font-medium pt-3 border-t border-border">
            <span>Total</span>
            <span className="font-serif text-base">
              {formatMoney(order.total, order.currency)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button asChild variant="outline" className="rounded-none uppercase tracking-widest text-xs">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
