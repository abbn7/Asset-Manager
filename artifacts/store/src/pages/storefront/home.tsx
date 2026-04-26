import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useGetStoreSettings,
  useListFeaturedProducts,
  useListNewArrivals,
  useListBestSellers,
  useListCollections,
  useSubscribeNewsletter,
} from "@workspace/api-client-react";
import { ProductCard } from "@/components/storefront/product-card";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import heroImg from "@/assets/hero.png";
import editorial1 from "@/assets/editorial-1.png";
import moodboard1 from "@/assets/moodboard-1.png";
import moodboard2 from "@/assets/moodboard-2.png";

export default function HomePage() {
  const { data: settings } = useGetStoreSettings();
  const { data: featured = [] } = useListFeaturedProducts({ limit: 8 });
  const { data: newArrivals = [] } = useListNewArrivals({ limit: 4 });
  const { data: bestSellers = [] } = useListBestSellers({ limit: 4 });
  const { data: collections = [] } = useListCollections();
  const subscribe = useSubscribeNewsletter();
  const [email, setEmail] = useState("");

  const heroTitle = settings?.heroTitle || "Considered objects for the modern home";
  const heroSubtitle = settings?.heroSubtitle || "A quiet collection, made to last.";
  const heroImage = settings?.heroImageUrl || heroImg;

  return (
    <>
      <AnnouncementBar />

      <section className="relative -mt-20">
        <div className="relative h-[100svh] min-h-[600px] w-full overflow-hidden">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-transparent to-foreground/40" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full flex flex-col items-center justify-center text-center px-6 text-background"
          >
            <span className="text-xs uppercase tracking-[0.4em] mb-6 opacity-90">
              {settings?.tagline || "Spring Edition"}
            </span>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.05] max-w-4xl mb-6">
              {heroTitle}
            </h1>
            <p className="text-lg md:text-xl max-w-xl mb-10 opacity-95 font-light">
              {heroSubtitle}
            </p>
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                asChild
                className="bg-background text-foreground hover:bg-background/90 rounded-none px-8 h-12 text-xs uppercase tracking-widest"
                data-testid="button-hero-shop"
              >
                <Link href="/products">Shop the collection</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-none px-8 h-12 text-xs uppercase tracking-widest border-background text-background hover:bg-background hover:text-foreground"
                data-testid="button-hero-collections"
              >
                <Link href="/collections">Explore</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {collections.length > 0 && (
        <section className="py-24 px-6">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Curated
                </span>
                <h2 className="font-serif text-4xl md:text-5xl mt-3">Collections</h2>
              </div>
              <Link
                href="/collections"
                className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-widest hover:text-primary transition-colors"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {collections.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  href={`/collections/${c.slug}`}
                  className="group relative aspect-[4/5] overflow-hidden bg-muted block"
                  data-testid={`link-collection-${c.slug}`}
                >
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-muted to-secondary" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 text-background">
                    <h3 className="font-serif text-2xl mb-1">{c.name}</h3>
                    <span className="text-xs uppercase tracking-widest opacity-90">
                      {c.productCount} {c.productCount === 1 ? "piece" : "pieces"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Just in
              </span>
              <h2 className="font-serif text-4xl md:text-5xl mt-3">New arrivals</h2>
            </div>
            <Link
              href="/products?sort=newest"
              className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-widest hover:text-primary transition-colors"
            >
              Shop new <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {newArrivals.length === 0 ? (
            <div className="border border-dashed border-border py-20 text-center">
              <p className="font-serif text-xl mb-2">The collection is being prepared</p>
              <p className="text-muted-foreground text-sm">New pieces arriving soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="container mx-auto max-w-7xl grid md:grid-cols-2 gap-16 items-center">
          <div className="aspect-[3/4] relative overflow-hidden">
            <img
              src={editorial1}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="md:pl-12">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Our values
            </span>
            <h2 className="font-serif text-4xl md:text-5xl mt-4 mb-6 leading-tight">
              Made slowly, kept always.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Every piece is considered — designed to be worn, used, and lived with for
              years. We work with small ateliers and natural materials, producing in
              limited runs because the right thing rarely needs to be made twice.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              This is a quieter way of consuming, and a slower way of making.
            </p>
            <Button
              variant="link"
              asChild
              className="px-0 text-foreground gap-2 uppercase tracking-widest text-xs"
            >
              <Link href="/collections">Explore the collections <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="py-24 px-6 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Selected
                </span>
                <h2 className="font-serif text-4xl md:text-5xl mt-3">Featured</h2>
              </div>
              <Link
                href="/products"
                className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-widest hover:text-primary transition-colors"
              >
                Shop all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
              {featured.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section className="py-24 px-6">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Loved most
                </span>
                <h2 className="font-serif text-4xl md:text-5xl mt-3">Best sellers</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src={moodboard2} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative container mx-auto max-w-2xl text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Letters
          </span>
          <h2 className="font-serif text-4xl md:text-5xl mt-3 mb-4">Join our world</h2>
          <p className="text-muted-foreground mb-8">
            Quiet dispatches on new arrivals, the people behind the work, and the
            inspiration behind each season.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              subscribe.mutate(
                { data: { email } },
                {
                  onSuccess: () => {
                    toast.success("Thank you for subscribing.");
                    setEmail("");
                  },
                  onError: () => toast.error("Please try again."),
                },
              );
            }}
            className="flex gap-3 max-w-md mx-auto"
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="rounded-none h-12 bg-background"
              data-testid="input-newsletter-email"
            />
            <Button
              type="submit"
              disabled={subscribe.isPending}
              className="rounded-none h-12 px-6 text-xs uppercase tracking-widest"
              data-testid="button-newsletter-subscribe"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        <div className="aspect-square md:aspect-auto md:h-[60vh] relative overflow-hidden">
          <img src={moodboard1} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="aspect-square md:aspect-auto md:h-[60vh] bg-foreground text-background flex items-center justify-center px-12">
          <div className="max-w-md">
            <h2 className="font-serif text-4xl md:text-5xl mb-6 leading-tight">
              Crafted with intention.
            </h2>
            <p className="opacity-90 leading-relaxed mb-8">
              Each piece in our collection is the result of careful collaboration with
              artisans who share our commitment to materials, craft, and time.
            </p>
            <Button
              variant="outline"
              asChild
              className="rounded-none border-background text-background hover:bg-background hover:text-foreground uppercase tracking-widest text-xs"
            >
              <Link href="/products">Discover the collection</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
