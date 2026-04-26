import { useState } from "react";
import { Link } from "wouter";
import { useListOrders } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableEmpty } from "@/components/admin/data-table-empty";
import { Search, ShoppingBag } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/format";

export default function AdminOrdersList() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);
  const limit = 25;

  const { data, isLoading } = useListOrders({
    q: q || undefined,
    status: status === "all" ? undefined : (status as "pending" | "paid" | "fulfilled" | "cancelled" | "refunded"),
    limit,
    offset: page * limit,
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="font-serif text-3xl">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} total</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Search by order number, email, or name"
            className="pl-10 rounded-none h-10"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
          <SelectTrigger className="w-[180px] rounded-none h-10">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-background border border-border">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-none" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <DataTableEmpty
              icon={ShoppingBag}
              title="No orders"
              description="Orders will appear here as they come in."
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Items</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-3 font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="hover:text-primary">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                  <td className="px-6 py-3">
                    <div>{o.customerName || "—"}</div>
                    <div className="text-xs text-muted-foreground">{o.email}</div>
                  </td>
                  <td className="px-6 py-3 text-xs uppercase tracking-widest">{o.status}</td>
                  <td className="px-6 py-3">{o.items.length}</td>
                  <td className="px-6 py-3 text-right font-medium">{formatMoney(o.total, o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > limit && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-none">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * limit >= total} onClick={() => setPage((p) => p + 1)} className="rounded-none">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
