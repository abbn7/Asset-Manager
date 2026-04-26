import { useState } from "react";
import {
  useGetRevenueAnalytics,
  useGetTopProducts,
} from "@workspace/api-client-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { StatCard } from "@/components/admin/stat-card";
import { TrendingUp, ShoppingBag, Package } from "lucide-react";

type Range = "7d" | "30d" | "90d" | "12m";

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>("30d");
  const { data: revenue, isLoading } = useGetRevenueAnalytics({ range });
  const { data: topProducts = [] } = useGetTopProducts({ limit: 10 });

  const ranges: { value: Range; label: string }[] = [
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
    { value: "12m", label: "12 months" },
  ];

  const points = revenue?.points ?? [];
  const fmtDate = (d: string) => {
    if (range === "12m") return new Date(`${d}-01`).toLocaleDateString("en-US", { month: "short" });
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-serif text-3xl">Analytics</h1>
        <div className="flex gap-1 border border-border">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                range === r.value
                  ? "bg-foreground text-background"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Revenue"
          value={formatMoney(revenue?.totalRevenue ?? 0, revenue?.currency ?? "USD")}
          icon={TrendingUp}
          hint={`Last ${range}`}
        />
        <StatCard
          label="Orders"
          value={String(revenue?.totalOrders ?? 0)}
          icon={ShoppingBag}
          hint={`Last ${range}`}
        />
        <StatCard
          label="Top products"
          value={String(topProducts.length)}
          icon={Package}
          hint="all time"
        />
      </div>

      <div className="bg-background border border-border p-6">
        <h2 className="font-serif text-xl mb-6">Revenue over time</h2>
        <div className="h-80">
          {isLoading ? (
            <Skeleton className="h-full rounded-none" />
          ) : points.every((p) => p.revenue === 0) ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No revenue in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={fmtDate}
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
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-background border border-border p-6">
        <h2 className="font-serif text-xl mb-6">Orders over time</h2>
        <div className="h-72">
          {points.every((p) => p.orders === 0) ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No orders in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={fmtDate}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="orders" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-background border border-border p-6">
        <h2 className="font-serif text-xl mb-6">Top products</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No sales yet</p>
        ) : (
          <ul className="space-y-3">
            {topProducts.map((p, i) => (
              <li key={p.productId} className="flex items-center gap-4">
                <span className="font-serif text-2xl text-muted-foreground w-8">{i + 1}</span>
                <div className="w-12 h-12 bg-muted overflow-hidden">
                  {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.unitsSold} sold</div>
                </div>
                <span className="font-medium">{formatMoney(p.revenue, p.currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
