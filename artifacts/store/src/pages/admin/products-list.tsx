import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts,
  useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { DataTableEmpty } from "@/components/admin/data-table-empty";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

export default function AdminProductsList() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const limit = 25;

  const { data, isLoading } = useListProducts({ q: q || undefined, limit, offset: page * limit });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const del = useDeleteProduct();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total</p>
        </div>
        <Button asChild className="rounded-none uppercase tracking-widest text-xs">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" /> Add product
          </Link>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Search products"
          className="pl-10 rounded-none h-10"
          data-testid="input-search-products"
        />
      </div>

      <div className="bg-background border border-border">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-none" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <DataTableEmpty
              icon={Package}
              title={q ? "No products match" : "No products yet"}
              description={q ? "Try a different search term." : "Add your first product to begin filling the catalog."}
              action={
                !q ? (
                  <Button asChild className="rounded-none">
                    <Link href="/admin/products/new">
                      <Plus className="h-4 w-4 mr-2" /> Add product
                    </Link>
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted overflow-hidden shrink-0">
                        {p.images?.[0] && (
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-medium hover:text-primary"
                          data-testid={`link-product-${p.id}`}
                        >
                          {p.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs uppercase tracking-widest px-2 py-1 ${
                          p.inStock ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.inStock ? "In stock" : "Sold out"}
                      </span>
                      {p.featured && (
                        <span className="text-xs uppercase tracking-widest px-2 py-1 bg-primary/10 text-primary">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">{formatMoney(p.price, p.currency)}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/admin/products/${p.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setPendingDelete({ id: p.id, name: p.name })}
                        data-testid={`button-delete-${p.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
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
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-none"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-none"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will be permanently removed from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!pendingDelete) return;
                del.mutate(
                  { id: pendingDelete.id },
                  {
                    onSuccess: () => {
                      qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
                      toast.success("Product deleted");
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
