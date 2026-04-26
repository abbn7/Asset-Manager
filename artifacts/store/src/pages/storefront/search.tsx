import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useSearchCatalog } from "@workspace/api-client-react";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState } from "@/components/storefront/empty-state";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const [location] = useLocation();
  const initialQ = useMemo(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    return new URLSearchParams(search).get("q") || "";
  }, [location]);
  const [q, setQ] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading } = useSearchCatalog({ q: debounced }, { query: { enabled: debounced.length > 0 } as never });

  return (
    <div className="container mx-auto px-6 py-16 max-w-5xl">
      <h1 className="font-serif text-5xl md:text-6xl text-center mb-10">Search</h1>

      <div className="relative mb-12">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What are you looking for?"
          className="pl-12 h-14 rounded-none text-base"
          data-testid="input-search"
        />
      </div>

      {!debounced ? (
        <p className="text-center text-muted-foreground">
          Start typing to find products and collections.
        </p>
      ) : isLoading ? (
        <p className="text-center text-muted-foreground">Searching…</p>
      ) : (data?.products?.length ?? 0) + (data?.collections?.length ?? 0) === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No results"
          description={`We couldn't find anything for "${debounced}". Try a different word.`}
        />
      ) : (
        <div className="space-y-12">
          {data!.collections.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
                Collections
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {data!.collections.map((c) => (
                  <Link
                    key={c.id}
                    href={`/collections/${c.slug}`}
                    className="group block bg-muted aspect-[4/3] relative overflow-hidden"
                  >
                    {c.imageUrl && (
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-foreground/40" />
                    <span className="absolute bottom-4 left-4 text-background font-serif text-xl">
                      {c.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {data!.products.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
                Products
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                {data!.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
