import { Link } from "wouter";
import { useListCollections } from "@workspace/api-client-react";
import { EmptyState } from "@/components/storefront/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function CollectionsPage() {
  const { data: collections = [], isLoading } = useListCollections();

  return (
    <div className="container mx-auto px-6 py-16 max-w-7xl">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Edited
        </span>
        <h1 className="font-serif text-5xl md:text-6xl mt-4">Collections</h1>
        <p className="text-muted-foreground mt-6 leading-relaxed">
          Each collection brings together a deliberate edit of pieces — built around a
          mood, a material, or a story.
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/10] rounded-none" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No collections yet"
          description="The first edit is being put together. Visit the admin to add the first collection."
          action={
            <Button asChild variant="outline" className="rounded-none">
              <Link href="/admin/collections/new">Add a collection</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {collections.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
            >
              <Link
                href={`/collections/${c.slug}`}
                className="group block relative aspect-[16/10] overflow-hidden bg-muted"
                data-testid={`link-collection-${c.slug}`}
              >
                {c.imageUrl ? (
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-background">
                  <span className="text-xs uppercase tracking-[0.3em] opacity-90">
                    {c.productCount} {c.productCount === 1 ? "piece" : "pieces"}
                  </span>
                  <h2 className="font-serif text-3xl md:text-4xl mt-2">{c.name}</h2>
                  {c.description && (
                    <p className="opacity-90 max-w-md mt-2 text-sm">{c.description}</p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
