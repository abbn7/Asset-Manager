import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  useGetCart,
  useCheckout,
} from "@workspace/api-client-react";
import { useCartToken } from "@/hooks/use-cart-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";
import { EmptyState } from "@/components/storefront/empty-state";

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { token, clearToken } = useCartToken();
  const { data: cart, isLoading } = useGetCart({ token }, { query: { enabled: !!token } as never });
  const checkout = useCheckout();

  const [email, setEmail] = useState("");
  const [addr, setAddr] = useState({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "United States",
    phone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkout.mutate(
      {
        data: {
          token,
          email,
          shippingAddress: {
            fullName: addr.fullName,
            line1: addr.line1,
            line2: addr.line2 || undefined,
            city: addr.city,
            region: addr.region || undefined,
            postalCode: addr.postalCode,
            country: addr.country,
            phone: addr.phone || undefined,
          },
        },
      },
      {
        onSuccess: (order) => {
          toast.success("Order placed", { description: `Confirmation ${order.orderNumber}` });
          try {
            const list = JSON.parse(localStorage.getItem("store_orders") || "[]") as string[];
            if (!list.includes(order.id)) list.unshift(order.id);
            localStorage.setItem("store_orders", JSON.stringify(list.slice(0, 50)));
            localStorage.setItem("store_email", email);
          } catch {
            // ignore localStorage errors
          }
          clearToken();
          navigate(`/orders/${order.id}`);
        },
        onError: () => toast.error("Could not place order — please try again"),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <Skeleton className="h-12 w-48 mb-8 rounded-none" />
        <Skeleton className="h-96 rounded-none" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-6 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Add something to your bag before checking out."
          action={
            <Button asChild className="rounded-none uppercase tracking-widest text-xs">
              <Link href="/products">Browse products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <button
        onClick={() => navigate("/cart")}
        className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors mb-8"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to bag
      </button>
      <h1 className="font-serif text-5xl mb-12">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_400px] gap-12">
        <div className="space-y-10">
          <section>
            <h2 className="font-serif text-2xl mb-6">Contact</h2>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-none h-12"
                data-testid="input-email"
              />
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl mb-6">Shipping address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs uppercase tracking-widest">Full name</Label>
                <Input
                  required
                  value={addr.fullName}
                  onChange={(e) => setAddr({ ...addr, fullName: e.target.value })}
                  className="rounded-none h-12"
                  data-testid="input-fullname"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs uppercase tracking-widest">Address</Label>
                <Input
                  required
                  value={addr.line1}
                  onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
                  className="rounded-none h-12"
                  data-testid="input-line1"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs uppercase tracking-widest">Apartment, suite (optional)</Label>
                <Input
                  value={addr.line2}
                  onChange={(e) => setAddr({ ...addr, line2: e.target.value })}
                  className="rounded-none h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest">City</Label>
                <Input
                  required
                  value={addr.city}
                  onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                  className="rounded-none h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest">State / Region</Label>
                <Input
                  value={addr.region}
                  onChange={(e) => setAddr({ ...addr, region: e.target.value })}
                  className="rounded-none h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest">Postal code</Label>
                <Input
                  required
                  value={addr.postalCode}
                  onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })}
                  className="rounded-none h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest">Country</Label>
                <Input
                  required
                  value={addr.country}
                  onChange={(e) => setAddr({ ...addr, country: e.target.value })}
                  className="rounded-none h-12"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs uppercase tracking-widest">Phone (optional)</Label>
                <Input
                  value={addr.phone}
                  onChange={(e) => setAddr({ ...addr, phone: e.target.value })}
                  className="rounded-none h-12"
                />
              </div>
            </div>
          </section>

          <section className="bg-muted/40 p-6">
            <h3 className="text-xs uppercase tracking-widest font-medium mb-3">
              Payment
            </h3>
            <p className="text-sm text-muted-foreground">
              This template ships ready for any payment provider. Order placement is
              available for review purposes — connect a provider before going live.
            </p>
          </section>

          <Button
            type="submit"
            size="lg"
            disabled={checkout.isPending}
            className="w-full rounded-none uppercase tracking-widest text-xs h-12"
            data-testid="button-place-order"
          >
            {checkout.isPending ? "Placing order…" : "Place order"}
          </Button>
        </div>

        <aside className="bg-muted/40 p-8 self-start space-y-6">
          <h2 className="font-serif text-xl">Your order</h2>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-3 text-sm">
                <div className="relative w-16 h-20 bg-muted overflow-hidden shrink-0">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-xs text-muted-foreground">{item.variantName}</p>
                  )}
                </div>
                <span>{formatMoney(item.lineTotal, cart.currency)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm pt-4 border-t border-border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(cart.subtotal, cart.currency)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Discount</span>
                <span>−{formatMoney(cart.discount, cart.currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{cart.shipping === 0 ? "Free" : formatMoney(cart.shipping, cart.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatMoney(cart.tax, cart.currency)}</span>
            </div>
            <div className="flex justify-between font-medium pt-3 border-t border-border">
              <span>Total</span>
              <span className="font-serif text-lg">
                {formatMoney(cart.total, cart.currency)}
              </span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
