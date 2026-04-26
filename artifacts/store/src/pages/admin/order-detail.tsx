import { Link, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetOrderById,
  useUpdateOrderStatus,
  getGetOrderByIdQueryKey,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { toast } from "sonner";

export default function AdminOrderDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: order, isLoading } = useGetOrderById(id, { query: { enabled: !!id } as never });
  const update = useUpdateOrderStatus();

  if (isLoading) {
    return <Skeleton className="h-96 rounded-none max-w-3xl" />;
  }
  if (!order) {
    return (
      <div className="text-center py-20">
        <h2 className="font-serif text-2xl mb-4">Order not found</h2>
        <Button asChild variant="outline" className="rounded-none">
          <Link href="/admin/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link
          href="/admin/orders"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Orders
        </Link>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl">Order {order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground mt-1">Placed {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Status</span>
            <Select
              value={order.status}
              onValueChange={(v) => {
                update.mutate(
                  { id, data: { status: v as "pending" | "paid" | "fulfilled" | "cancelled" | "refunded" } },
                  {
                    onSuccess: () => {
                      qc.invalidateQueries({ queryKey: getGetOrderByIdQueryKey(id) });
                      qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
                      toast.success("Status updated");
                    },
                  },
                );
              }}
            >
              <SelectTrigger className="w-[160px] rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div className="bg-background border border-border p-6">
          <h2 className="font-serif text-xl mb-4">Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
                <div className="w-16 h-20 bg-muted overflow-hidden shrink-0">
                  {item.productImage && <img src={item.productImage} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.productName}</div>
                  {item.variantName && (
                    <div className="text-xs text-muted-foreground">{item.variantName}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Qty {item.quantity} · {formatMoney(item.unitPrice, order.currency)} each
                  </div>
                </div>
                <span className="font-medium">{formatMoney(item.lineTotal, order.currency)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm pt-6 mt-6 border-t border-border">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMoney(order.subtotal, order.currency)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-primary"><span>Discount</span><span>−{formatMoney(order.discount, order.currency)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping === 0 ? "Free" : formatMoney(order.shipping, order.currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatMoney(order.tax, order.currency)}</span></div>
            <div className="flex justify-between font-medium pt-2 border-t border-border text-base"><span>Total</span><span className="font-serif">{formatMoney(order.total, order.currency)}</span></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-background border border-border p-6">
            <h3 className="text-xs uppercase tracking-widest font-medium mb-3">Customer</h3>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.email}</p>
          </div>
          <div className="bg-background border border-border p-6">
            <h3 className="text-xs uppercase tracking-widest font-medium mb-3">Ship to</h3>
            <address className="not-italic text-sm leading-relaxed">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.line1}{order.shippingAddress.line2 && <><br />{order.shippingAddress.line2}</>}<br />
              {order.shippingAddress.city}{order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ""} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
              {order.shippingAddress.phone && <><br />{order.shippingAddress.phone}</>}
            </address>
          </div>
        </div>
      </div>
    </div>
  );
}
