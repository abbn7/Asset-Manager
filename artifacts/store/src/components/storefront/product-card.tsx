import { Link } from "wouter";
import type { Product } from "@workspace/api-client-react";
import { formatMoney } from "@/lib/format";
import { ShoppingBag } from "lucide-react";

interface Props {
  product: Pick<Product, "slug" | "name" | "price" | "compareAtPrice" | "currency" | "images" | "inStock" | "tags">;
  showQuickAdd?: boolean;
  onQuickAdd?: () => void;
}

export function ProductCard({ product, showQuickAdd = false, onQuickAdd }: Props) {
  const img = product.images?.[0];
  const second = product.images?.[1];
  const isNew = product.tags?.includes("new");
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
      data-testid={`link-product-${product.slug}`}
    >
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {img ? (
          <>
            <img
              src={img}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 group-hover:opacity-0"
              loading="lazy"
            />
            <img
              src={second || img}
              alt=""
              className="absolute inset-0 h-full w-full object-cover scale-105 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-100"
              loading="lazy"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-xs uppercase tracking-widest">
            No image
          </div>
        )}
        {!product.inStock && (
          <span className="absolute top-3 left-3 bg-background/90 px-2 py-1 text-[10px] uppercase tracking-widest font-medium">
            Sold out
          </span>
        )}
        {product.inStock && isNew && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 text-[10px] uppercase tracking-widest font-medium">
            New
          </span>
        )}
        {product.inStock && onSale && !isNew && (
          <span className="absolute top-3 left-3 bg-foreground text-background px-2 py-1 text-[10px] uppercase tracking-widest font-medium">
            Sale
          </span>
        )}
        {showQuickAdd && product.inStock && onQuickAdd && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onQuickAdd();
            }}
            className="absolute bottom-0 left-0 right-0 bg-foreground text-background py-3 text-xs uppercase tracking-widest opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2"
            data-testid={`button-quick-add-${product.slug}`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Quick add
          </button>
        )}
      </div>
      <div className="pt-4 space-y-1">
        <h3 className="font-serif text-base leading-snug">{product.name}</h3>
        <div className="flex items-baseline gap-2 text-sm">
          <span className={onSale ? "text-foreground font-medium" : "text-foreground"}>
            {formatMoney(product.price, product.currency)}
          </span>
          {onSale && (
            <span className="text-muted-foreground line-through text-xs">
              {formatMoney(product.compareAtPrice ?? 0, product.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
