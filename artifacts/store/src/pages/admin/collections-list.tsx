import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCollections,
  useDeleteCollection,
  getListCollectionsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableEmpty } from "@/components/admin/data-table-empty";
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
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

export default function AdminCollectionsList() {
  const qc = useQueryClient();
  const { data: collections = [], isLoading } = useListCollections();
  const del = useDeleteCollection();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">{collections.length} total</p>
        </div>
        <Button asChild className="rounded-none uppercase tracking-widest text-xs">
          <Link href="/admin/collections/new">
            <Plus className="h-4 w-4 mr-2" /> Add collection
          </Link>
        </Button>
      </div>

      <div className="bg-background border border-border">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-none" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="p-6">
            <DataTableEmpty
              icon={FolderOpen}
              title="No collections yet"
              description="Group your products into curated collections."
              action={
                <Button asChild className="rounded-none">
                  <Link href="/admin/collections/new">
                    <Plus className="h-4 w-4 mr-2" /> Add collection
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-3 font-medium">Collection</th>
                <th className="px-6 py-3 font-medium">Products</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 bg-muted overflow-hidden shrink-0">
                        {c.imageUrl && (
                          <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/collections/${c.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {c.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{c.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">{c.productCount}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/admin/collections/${c.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setPendingDelete({ id: c.id, name: c.name })}
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
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will be removed. Products in this collection will not be deleted.
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
                      qc.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
                      toast.success("Collection deleted");
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
