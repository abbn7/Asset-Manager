import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useApplyDiscountToCart,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { useCartToken } from "@/hooks/use-cart-token";
import { EmptyState } from "@/components/storefront/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Minus, Plus, X, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

export default function CartPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { token } = useCartToken();
  const [code, setCode] = useState("");

  const { data: cart, isLoading } = useGetCart({ token }, { query: { enabled: !!token } as never });
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const applyDiscount = useApplyDiscountToCart();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetCartQueryKey({ token }) });

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <Skeleton className="h-12 w-48 mb-8 rounded-none" />
        <Skeleton className="h-32 mb-4 rounded-none" />
        <Skeleton className="h-32 mb-4 rounded-none" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-16 max-w-6xl">
      <h1 className="font-serif text-5xl mb-12">Your bag</h1>

      {!cart || cart.items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Begin curating your collection."
          action={
            <Button asChild className="rounded-none uppercase tracking-widest text-xs">
              <Link href="/products">Browse products</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="space-y-6">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-6 pb-6 border-b border-border"
                data-testid={`cart-item-${item.id}`}
              >
                <Link href={`/products/${item.productSlug}`} className="shrink-0 w-28 h-36 bg-muted overflow-hidden">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </Link>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="font-serif text-lg hover:text-primary transition-colors"
                      >
                        {item.productName}
                      </Link>
                      {item.variantName && (
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                          {item.variantName}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        removeItem.mutate(
                          { itemId: item.id, params: { token } },
                          { onSuccess: invalidate },
                        );
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label="Remove"
                      data-testid={`button-remove-${item.id}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <div className="flex items-center border border-border h-9">
                      <button
                        onClick={() =>
                          updateItem.mutate(
                            {
                              itemId: item.id,
                              data: { token, quantity: Math.max(0, item.quantity - 1) },
                            },
                            { onSuccess: invalidate },
                          )
                        }
                        className="px-2.5 h-full hover:bg-muted transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateItem.mutate(
                            {
                              itemId: item.id,
                              data: { token, quantity: item.quantity + 1 },
                            },
                            { onSuccess: invalidate },
                          )
                        }
                        className="px-2.5 h-full hover:bg-muted transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-medium">
                      {formatMoney(item.lineTotal, cart.currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="bg-muted/40 p-8 self-start space-y-6">
            <h2 className="font-serif text-2xl">Order summary</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!code) return;
                applyDiscount.mutate(
                  { data: { token, code } },
                  {
                    onSuccess: (resp) => {
                      invalidate();
                      if (resp.appliedDiscountCode) {
                        toast.success("Discount applied");
                        setCode("");
                      } else {
                        toast.error("That code isn't valid");
                      }
                    },
                  },
                );
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Discount code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="rounded-none h-10"
                data-testid="input-discount"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={applyDiscount.isPending}
                className="rounded-none h-10 uppercase tracking-widest text-xs"
                data-testid="button-apply-discount"
              >
                Apply
              </Button>
            </form>

            <div className="space-y-2 text-sm pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(cart.subtotal, cart.currency)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount {cart.appliedDiscountCode ? `(${cart.appliedDiscountCode})` : ""}</span>
                  <span>−{formatMoney(cart.discount, cart.currency)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {cart.shipping === 0 ? "Free" : formatMoney(cart.shipping, cart.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(cart.tax, cart.currency)}</span>
              </div>
              <div className="flex justify-between font-medium pt-3 border-t border-border text-base">
                <span>Total</span>
                <span className="font-serif text-lg">{formatMoney(cart.total, cart.currency)}</span>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => navigate("/checkout")}
              className="w-full rounded-none uppercase tracking-widest text-xs h-12"
              data-testid="button-checkout"
            >
              Checkout <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Shipping and taxes calculated at checkout
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
