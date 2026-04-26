import { useParams, Link } from "wouter";
import { useGetCollectionBySlug } from "@workspace/api-client-react";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState } from "@/components/storefront/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default function CollectionDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: collection, isLoading } = useGetCollectionBySlug(slug, { query: { enabled: !!slug } as never });

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-[50vh] w-full rounded-none" />
        <div className="container mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-none" />
          ))}
        </div>
      </div>
    );
  }
  if (!collection) {
    return (
      <div className="container mx-auto px-6 py-32 text-center">
        <h2 className="font-serif text-3xl mb-4">Collection not found</h2>
        <Button asChild variant="outline" className="rounded-none">
          <Link href="/collections">View all collections</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        {collection.imageUrl ? (
          <img
            src={collection.imageUrl}
            alt={collection.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
        )}
        <div className="absolute inset-0 bg-foreground/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-background text-center px-6">
          <span className="text-xs uppercase tracking-[0.3em] mb-4 opacity-90">
            Collection
          </span>
          <h1 className="font-serif text-5xl md:text-7xl max-w-3xl">{collection.name}</h1>
          {collection.description && (
            <p className="max-w-xl mt-6 opacity-90 leading-relaxed">{collection.description}</p>
          )}
        </div>
      </section>

      <section className="container mx-auto px-6 py-20 max-w-7xl">
        <div className="border-b border-border pb-4 mb-10">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {collection.products.length} {collection.products.length === 1 ? "piece" : "pieces"}
          </span>
        </div>
        {collection.products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products in this collection yet"
            description="Pieces are being added. Visit the admin to populate this collection."
            action={
              <Button asChild variant="outline" className="rounded-none">
                <Link href="/admin/products/new">Add a product</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
            {collection.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
