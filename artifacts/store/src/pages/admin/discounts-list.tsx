import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDiscounts,
  useDeleteDiscount,
  getListDiscountsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTableEmpty } from "@/components/admin/data-table-empty";
import { Plus, Trash2, Tags } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { toast } from "sonner";

export default function AdminDiscountsList() {
  const qc = useQueryClient();
  const { data: discounts = [], isLoading } = useListDiscounts();
  const del = useDeleteDiscount();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Discounts</h1>
          <p className="text-sm text-muted-foreground mt-1">{discounts.length} active</p>
        </div>
        <Button asChild className="rounded-none uppercase tracking-widest text-xs">
          <Link href="/admin/discounts/new">
            <Plus className="h-4 w-4 mr-2" /> New discount
          </Link>
        </Button>
      </div>

      <div className="bg-background border border-border">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-none" />)}
          </div>
        ) : discounts.length === 0 ? (
          <div className="p-6">
            <DataTableEmpty
              icon={Tags}
              title="No discount codes"
              description="Create your first discount to share with customers."
              action={
                <Button asChild className="rounded-none">
                  <Link href="/admin/discounts/new">
                    <Plus className="h-4 w-4 mr-2" /> New discount
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Value</th>
                <th className="px-6 py-3 font-medium">Usage</th>
                <th className="px-6 py-3 font-medium">Expires</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-3 font-mono">{d.code}</td>
                  <td className="px-6 py-3 text-xs uppercase tracking-widest">{d.type}</td>
                  <td className="px-6 py-3">
                    {d.type === "percentage" ? `${d.value}%` : formatMoney(d.value)}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {d.usageCount}{d.usageLimit ? ` / ${d.usageLimit}` : ""}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {d.expiresAt ? formatDate(d.expiresAt) : "Never"}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDelete(d.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete discount?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!pendingDelete) return;
                del.mutate(
                  { id: pendingDelete },
                  {
                    onSuccess: () => {
                      qc.invalidateQueries({ queryKey: getListDiscountsQueryKey() });
                      toast.success("Discount deleted");
                      setPendingDelete(null);
                    },
                  },
                );
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
