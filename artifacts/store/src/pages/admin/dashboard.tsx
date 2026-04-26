import { Link } from "wouter";
import {
  useGetAdminDashboard,
  useGetRevenueAnalytics,
  useGetTopProducts,
  useGetRecentAdminActivity,
} from "@workspace/api-client-react";
import { StatCard } from "@/components/admin/stat-card";
import { DataTableEmpty } from "@/components/admin/data-table-empty";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  ArrowUpRight,
  Activity,
  Plus,
} from "lucide-react";
import { formatMoney, formatRelativeTime, formatDate } from "@/lib/format";

export default function AdminDashboard() {
  const { data: dash, isLoading } = useGetAdminDashboard();
  const { data: revenue } = useGetRevenueAnalytics({ range: "30d" });
  const { data: topProducts = [] } = useGetTopProducts({ limit: 5 });
  const { data: activity = [] } = useGetRecentAdminActivity({ limit: 10 });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-4xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{today}</p>
        </div>
        <Button asChild className="rounded-none uppercase tracking-widest text-xs">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" /> Add product
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-none" />)
        ) : (
          <>
            <StatCard
              label="Revenue"
              value={formatMoney(dash?.totalRevenue ?? 0, dash?.currency ?? "USD")}
              changePct={dash?.revenueChangePct}
              icon={DollarSign}
              hint="vs prior 30 days"
            />
            <StatCard
              label="Orders"
              value={String(dash?.totalOrders ?? 0)}
              changePct={dash?.ordersChangePct}
              icon={ShoppingBag}
              hint="vs prior 30 days"
            />
            <StatCard
              label="Customers"
              value={String(dash?.totalCustomers ?? 0)}
              icon={Users}
              hint="all time"
            />
            <StatCard
              label="Products"
              value={String(dash?.totalProducts ?? 0)}
              icon={Package}
              hint={`${dash?.lowStockCount ?? 0} sold out`}
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="bg-background border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-xl">Revenue</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <Link
              to="/admin/analytics"
              className="text-xs uppercase tracking-widest hover:text-primary inline-flex items-center gap-1"
            >
              View analytics <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-72">
            {(revenue?.points?.length ?? 0) === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No revenue data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue?.points ?? []}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `$${v}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatMoney(v)}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-background border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-xl">Top products</h3>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sales yet</p>
          ) : (
            <ul className="space-y-4">
              {topProducts.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <div className="w-10 h-10 bg-muted overflow-hidden shrink-0">
                    {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.unitsSold} sold</div>
                  </div>
                  <span className="text-sm font-medium">
                    {formatMoney(p.revenue, p.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="bg-background border border-border p-6">
          <h3 className="font-serif text-xl mb-6">Recent orders</h3>
          {(dash?.recentOrders?.length ?? 0) === 0 ? (
            <DataTableEmpty
              icon={ShoppingBag}
              title="No orders yet"
              description="Orders will appear here once customers begin checking out."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {dash!.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <Link href={`/admin/orders/${o.id}`} className="hover:text-primary">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 truncate">{o.customerName || o.email}</td>
                    <td className="py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                    <td className="py-3 text-xs uppercase tracking-widest">{o.status}</td>
                    <td className="py-3 text-right font-medium">
                      {formatMoney(o.total, o.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-background border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-xl">Activity</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              All quiet for now
            </p>
          ) : (
            <ul className="space-y-4">
              {activity.map((e) => (
                <li key={e.id} className="text-sm">
                  <div>{e.message}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(e.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
