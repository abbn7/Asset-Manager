import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  useGetProductBySlug,
  useListRelatedProducts,
  useListReviewsForProduct,
  useCreateReview,
  useAddToCart,
  getGetCartQueryKey,
  getListReviewsForProductQueryKey,
} from "@workspace/api-client-react";
import { useCartToken } from "@/hooks/use-cart-token";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Star, ShoppingBag, Truck, RotateCcw, Heart, Minus, Plus, ChevronLeft } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/format";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { token } = useCartToken();

  const { data: product, isLoading } = useGetProductBySlug(slug, { query: { enabled: !!slug } as never });
  const { data: related = [] } = useListRelatedProducts(slug, { limit: 4 }, { query: { enabled: !!slug } as never });
  const { data: reviews = [] } = useListReviewsForProduct({ productId: product?.id ?? "" }, { query: { enabled: !!product?.id } as never });

  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ name: "", title: "", body: "", rating: 5 });
  const [wishlisted, setWishlisted] = useState(false);

  const addToCart = useAddToCart();
  const createReview = useCreateReview();

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-7xl grid md:grid-cols-2 gap-12">
        <Skeleton className="aspect-[3/4] rounded-none" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4 rounded-none" />
          <Skeleton className="h-6 w-1/4 rounded-none" />
          <Skeleton className="h-32 rounded-none" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-6 py-32 text-center">
        <h2 className="font-serif text-3xl mb-4">Product not found</h2>
        <Button variant="outline" asChild className="rounded-none">
          <Link href="/products">Browse all products</Link>
        </Button>
      </div>
    );
  }

  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const variants = product.variants ?? [];
  const selectedVariant = variants.find((v) => v.id === variantId);
  const displayPrice = selectedVariant?.price ?? product.price;

  const handleAdd = () => {
    if (variants.length > 0 && !variantId) {
      toast.error("Please select an option");
      return;
    }
    addToCart.mutate(
      {
        data: {
          token,
          productId: product.id,
          variantName: selectedVariant ? `${selectedVariant.name}: ${selectedVariant.value}` : "",
          quantity: qty,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetCartQueryKey({ token }) });
          toast.success(`Added to bag`, { description: product.name });
        },
        onError: () => toast.error("Could not add to bag"),
      },
    );
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.body) {
      toast.error("Please fill in your name and a comment");
      return;
    }
    createReview.mutate(
      {
        data: {
          productId: product.id,
          authorName: reviewForm.name,
          rating: reviewForm.rating,
          title: reviewForm.title,
          body: reviewForm.body,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListReviewsForProductQueryKey({ productId: product.id }) });
          setReviewForm({ name: "", title: "", body: "", rating: 5 });
          toast.success("Thank you for your review");
        },
      },
    );
  };

  return (
    <div>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <button
          onClick={() => navigate("/products")}
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
      </div>

      <div className="container mx-auto px-6 max-w-7xl grid md:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 pb-24">
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-muted overflow-hidden">
            {product.images?.[activeImage] ? (
              <motion.img
                key={activeImage}
                src={product.images[activeImage]}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground/40 text-xs uppercase tracking-widest">
                No image
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square overflow-hidden ${
                    i === activeImage ? "ring-1 ring-foreground" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:sticky md:top-28 self-start space-y-8">
          <div>
            {product.collections && product.collections.length > 0 && (
              <Link
                href={`/collections/${product.collections[0].slug}`}
                className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary"
              >
                {product.collections[0].name}
              </Link>
            )}
            <h1 className="font-serif text-4xl md:text-5xl mt-3 leading-tight">
              {product.name}
            </h1>
            {product.rating != null && (product.reviewCount ?? 0) > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.round(product.rating ?? 0)
                          ? "fill-foreground text-foreground"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl">{formatMoney(displayPrice, product.currency)}</span>
            {onSale && (
              <span className="text-muted-foreground line-through">
                {formatMoney(product.compareAtPrice ?? 0, product.currency)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {variants.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest font-medium mb-3">
                {variants[0]?.name || "Option"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    disabled={!v.inStock}
                    onClick={() => setVariantId(v.id)}
                    className={`px-4 py-2 text-sm border transition-colors ${
                      variantId === v.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground"
                    } ${!v.inStock ? "opacity-50 line-through cursor-not-allowed" : ""}`}
                    data-testid={`variant-${v.id}`}
                  >
                    {v.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center border border-border h-12">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 h-full hover:bg-muted transition-colors"
                aria-label="Decrease"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 h-full hover:bg-muted transition-colors"
                aria-label="Increase"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              size="lg"
              onClick={handleAdd}
              disabled={!product.inStock || addToCart.isPending}
              className="flex-1 rounded-none h-12 uppercase tracking-widest text-xs"
              data-testid="button-add-to-cart"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              {!product.inStock ? "Sold out" : addToCart.isPending ? "Adding…" : "Add to bag"}
            </Button>
            <button
              onClick={() => setWishlisted((w) => !w)}
              className="border border-border h-12 w-12 flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Wishlist"
            >
              <Heart className={`h-4 w-4 ${wishlisted ? "fill-foreground" : ""}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <div className="text-foreground font-medium mb-0.5">Complimentary shipping</div>
                <div>On orders over $100</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RotateCcw className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <div className="text-foreground font-medium mb-0.5">30-day returns</div>
                <div>Easy and free</div>
              </div>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {product.fullDescription && (
              <AccordionItem value="description" className="border-border">
                <AccordionTrigger className="text-xs uppercase tracking-widest">
                  Description
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {product.fullDescription}
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="shipping" className="border-border">
              <AccordionTrigger className="text-xs uppercase tracking-widest">
                Shipping
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Standard shipping is complimentary on orders over $100. Express shipping
                available at checkout. Most orders ship within 1–2 business days.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns" className="border-border">
              <AccordionTrigger className="text-xs uppercase tracking-widest">
                Returns
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                We offer 30-day free returns on unused items in original packaging.
                Final-sale items are not eligible for return.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-muted/30 py-24 px-6">
          <div className="container mx-auto max-w-7xl">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
              You may also like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container mx-auto px-6 py-24 max-w-4xl">
        <h2 className="font-serif text-3xl md:text-4xl mb-2">Reviews</h2>
        <p className="text-muted-foreground mb-12">
          {reviews.length === 0
            ? "Be the first to share your thoughts."
            : `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`}
        </p>

        <div className="space-y-8 mb-16">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border pb-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{r.authorName}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < r.rating ? "fill-foreground text-foreground" : "text-muted-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
              </div>
              {r.title && <h4 className="font-serif text-lg mb-1">{r.title}</h4>}
              <p className="text-muted-foreground leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleReview} className="space-y-4 max-w-xl">
          <h3 className="font-serif text-2xl mb-2">Write a review</h3>
          <div>
            <label className="text-xs uppercase tracking-widest mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                  className="p-1"
                >
                  <Star
                    className={`h-5 w-5 ${
                      n <= reviewForm.rating ? "fill-foreground text-foreground" : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <Input
            placeholder="Your name"
            value={reviewForm.name}
            onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
            className="rounded-none"
            data-testid="input-review-name"
          />
          <Input
            placeholder="Title (optional)"
            value={reviewForm.title}
            onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
            className="rounded-none"
          />
          <Textarea
            placeholder="Share your experience"
            value={reviewForm.body}
            onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
            className="rounded-none min-h-32"
            data-testid="input-review-body"
          />
          <Button
            type="submit"
            disabled={createReview.isPending}
            className="rounded-none uppercase tracking-widest text-xs h-11 px-6"
            data-testid="button-submit-review"
          >
            Submit review
          </Button>
        </form>
      </section>
    </div>
  );
}
