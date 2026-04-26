import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  useListProducts,
  useListCollections,
} from "@workspace/api-client-react";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState } from "@/components/storefront/empty-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Package, X } from "lucide-react";
import { motion } from "framer-motion";

type Sort = "newest" | "price_asc" | "price_desc" | "popular" | "name_asc";

export default function ProductsListPage() {
  const [location, setLocation] = useLocation();
  const params = useMemo(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    return new URLSearchParams(search);
  }, [location]);

  const initialCollection = params.get("collection") || "";
  const initialTag = params.get("tag") || "";
  const initialSort = (params.get("sort") as Sort) || "newest";

  const [collection, setCollection] = useState<string>(initialCollection);
  const [tag, setTag] = useState<string>(initialTag);
  const [sort, setSort] = useState<Sort>(initialSort);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [page, setPage] = useState(0);
  const limit = 24;

  const { data: collections = [] } = useListCollections();

  const queryParams: Record<string, unknown> = { sort, limit, offset: page * limit };
  if (collection) queryParams.collection = collection;
  if (tag) queryParams.tag = tag;
  if (priceRange[0] > 0) queryParams.minPrice = priceRange[0];
  if (priceRange[1] < 1000) queryParams.maxPrice = priceRange[1];

  const { data, isLoading } = useListProducts(queryParams);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of items) for (const t of p.tags ?? []) set.add(t);
    return Array.from(set).sort();
  }, [items]);

  useEffect(() => {
    setPage(0);
  }, [collection, tag, sort, priceRange]);

  const clearFilters = () => {
    setCollection("");
    setTag("");
    setPriceRange([0, 1000]);
  };
  const hasFilters =
    collection || tag || priceRange[0] > 0 || priceRange[1] < 1000;

  return (
    <div className="container mx-auto px-6 py-16 max-w-7xl">
      <div className="text-center mb-16">
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          The catalog
        </span>
        <h1 className="font-serif text-5xl md:text-6xl mt-4">All Products</h1>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-12">
        <aside className="space-y-10">
          <div>
            <h3 className="text-xs uppercase tracking-widest font-medium mb-4">
              Collection
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setCollection("")}
                className={`block text-sm hover:text-primary transition-colors text-left ${
                  collection === "" ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
                data-testid="filter-collection-all"
              >
                All
              </button>
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCollection(c.slug)}
                  className={`block text-sm hover:text-primary transition-colors text-left ${
                    collection === c.slug
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                  data-testid={`filter-collection-${c.slug}`}
                >
                  {c.name}
                </button>
              ))}
              {collections.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No collections yet
                </p>
              )}
            </div>
          </div>

          {allTags.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest font-medium mb-4">
                Tag
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTag("")}
                  className={`text-xs px-3 py-1.5 border transition-colors ${
                    tag === "" ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
                  }`}
                >
                  All
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTag(t)}
                    className={`text-xs px-3 py-1.5 border transition-colors ${
                      tag === t
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs uppercase tracking-widest font-medium mb-4">
              Price
            </h3>
            <Slider
              value={priceRange}
              onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
              min={0}
              max={1000}
              step={10}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}{priceRange[1] === 1000 ? "+" : ""}</span>
            </div>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs uppercase tracking-widest gap-2 -ml-2"
            >
              <X className="h-3 w-3" />
              Clear filters
            </Button>
          )}
        </aside>

        <div>
          <div className="flex items-center justify-between border-b border-border pb-4 mb-10">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {isLoading ? "—" : `${total} ${total === 1 ? "piece" : "pieces"}`}
            </span>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger
                className="w-[200px] rounded-none border-0 border-b text-xs uppercase tracking-widest"
                data-testid="select-sort"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most popular</SelectItem>
                <SelectItem value="price_asc">Price: Low to high</SelectItem>
                <SelectItem value="price_desc">Price: High to low</SelectItem>
                <SelectItem value="name_asc">Name A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-none" />
                  <Skeleton className="h-4 w-3/4 rounded-none" />
                  <Skeleton className="h-4 w-1/3 rounded-none" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products yet"
              description={
                hasFilters
                  ? "Try adjusting your filters to see more pieces."
                  : "The collection is being curated. Check back soon, or visit the admin to add the first pieces."
              }
              action={
                hasFilters ? (
                  <Button onClick={clearFilters} variant="outline" className="rounded-none">
                    Clear filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12"
            >
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </motion.div>
          )}

          {total > limit && (
            <div className="flex items-center justify-center gap-3 mt-16">
              <Button
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-none"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {Math.ceil(total / limit)}
              </span>
              <Button
                variant="outline"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-none"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
