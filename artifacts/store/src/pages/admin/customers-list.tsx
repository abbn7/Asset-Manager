import { useState } from "react";
import { useListCustomers } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableEmpty } from "@/components/admin/data-table-empty";
import { Search, Users } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/format";

export default function AdminCustomersList() {
  const [q, setQ] = useState("");
  const { data: customers = [], isLoading } = useListCustomers({ q: q || undefined });

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="font-serif text-3xl">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">{customers.length} total</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email"
          className="pl-10 rounded-none h-10"
        />
      </div>

      <div className="bg-background border border-border">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-none" />)}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-6">
            <DataTableEmpty
              icon={Users}
              title="No customers yet"
              description="Customer details appear here once orders are placed."
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Orders</th>
                <th className="px-6 py-3 font-medium">Last order</th>
                <th className="px-6 py-3 font-medium text-right">Total spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-3">
                    <div className="font-medium">{c.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="px-6 py-3">{c.orderCount}</td>
                  <td className="px-6 py-3 text-muted-foreground">{formatDate(c.lastOrderAt)}</td>
                  <td className="px-6 py-3 text-right font-medium">{formatMoney(c.totalSpent, c.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
