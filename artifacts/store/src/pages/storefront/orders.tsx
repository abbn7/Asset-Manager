import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useListOrders } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/storefront/empty-state";
import { Package, ChevronRight } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/format";

export default function OrdersPage() {
  const [email, setEmail] = useState<string>(
    typeof window !== "undefined"
      ? localStorage.getItem("store_email") || ""
      : "",
  );
  const [submitted, setSubmitted] = useState<string>(email);

  useEffect(() => {
    if (email && !submitted) setSubmitted(email);
  }, [email, submitted]);

  const { data, isLoading } = useListOrders({ q: submitted, limit: 50 }, { query: { enabled: !!submitted } as never });
  const orders = (data?.items ?? []).filter(
    (o) => o.email.toLowerCase() === submitted.toLowerCase(),
  );

  return (
    <div className="container mx-auto px-6 py-16 max-w-3xl">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Personal
        </span>
        <h1 className="font-serif text-5xl md:text-6xl mt-4">Your orders</h1>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(email);
          localStorage.setItem("store_email", email);
        }}
        className="bg-muted/40 p-6 mb-8"
      >
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest">
            Find your orders by email
          </Label>
          <div className="flex gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-none h-12"
              placeholder="you@example.com"
              data-testid="input-orders-email"
            />
            <Button type="submit" className="rounded-none h-12 px-6 uppercase tracking-widest text-xs">
              Find
            </Button>
          </div>
        </div>
      </form>

      {!submitted ? (
        <p className="text-center text-muted-foreground text-sm">
          Enter the email used at checkout to view your orders.
        </p>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-none" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders found"
          description="We couldn't find any orders for that email."
          action={
            <Button asChild variant="outline" className="rounded-none">
              <Link href="/products">Continue shopping</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="block border border-border p-6 hover:border-foreground transition-colors group"
              data-testid={`link-order-${o.id}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Order {o.orderNumber}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Placed {formatDate(o.createdAt)} · {o.items.length}{" "}
                    {o.items.length === 1 ? "item" : "items"}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs uppercase tracking-widest px-2 py-1 bg-muted">
                    {o.status}
                  </span>
                  <span className="font-medium">{formatMoney(o.total, o.currency)}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
