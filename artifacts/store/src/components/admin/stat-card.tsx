import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  changePct?: number | null;
  icon?: LucideIcon;
  hint?: string;
}

export function StatCard({ label, value, changePct, icon: Icon, hint }: Props) {
  const Trend = changePct == null ? null : changePct > 0 ? TrendingUp : changePct < 0 ? TrendingDown : Minus;
  const trendClass =
    changePct == null
      ? ""
      : changePct > 0
      ? "text-emerald-600"
      : changePct < 0
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <div className="bg-background border border-border p-6">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />}
      </div>
      <div className="font-serif text-3xl mb-2">{value}</div>
      <div className="flex items-center gap-2 text-xs">
        {Trend && (
          <span className={`flex items-center gap-1 ${trendClass}`}>
            <Trend className="h-3 w-3" strokeWidth={2} />
            {Math.abs(changePct ?? 0)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
