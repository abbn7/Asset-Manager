import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { useGetCart, useGetStoreSettings } from "@workspace/api-client-react";
import { useCartToken } from "@/hooks/use-cart-token";
import { Button } from "@/components/ui/button";

export function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { token } = useCartToken();
  const { data: cart } = useGetCart({ token }, { query: { enabled: !!token } as never });
  const { data: settings } = useGetStoreSettings();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const cartItemCount = cart?.itemCount || 0;

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border/40" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex-1 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/products" className="text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors">
                Shop
              </Link>
              <Link href="/collections" className="text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors">
                Collections
              </Link>
            </nav>
          </div>

          <Link href="/" className="text-2xl font-serif tracking-widest uppercase font-semibold">
            {settings?.name || "MAISON"}
          </Link>

          <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
              <Link href="/search">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-background">
          <div className="p-4 flex justify-between items-center border-b">
            <span className="font-serif text-xl tracking-widest uppercase">{settings?.name || "MAISON"}</span>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex flex-col p-6 gap-6 text-xl font-serif">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/products" className="hover:text-primary transition-colors">Shop All</Link>
            <Link href="/collections" className="hover:text-primary transition-colors">Collections</Link>
            <Link href="/search" className="hover:text-primary transition-colors">Search</Link>
          </nav>
        </div>
      )}

      <main className="flex-grow pt-20">
        {children}
      </main>

      <footer className="border-t border-border/40 py-16 bg-muted/30">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-sm">
          <div>
            <h3 className="font-serif text-lg mb-4 tracking-wide uppercase">{settings?.name || "MAISON"}</h3>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              {settings?.footerText || "Elevated essentials for the modern lifestyle. Crafted with intention."}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4 uppercase tracking-wider text-xs">Shop</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground transition-colors">All Products</Link></li>
              <li><Link href="/collections" className="hover:text-foreground transition-colors">Collections</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4 uppercase tracking-wider text-xs">Connect</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li><a href={settings?.instagramUrl || "#"} className="hover:text-foreground transition-colors">Instagram</a></li>
              <li><a href={settings?.twitterUrl || "#"} className="hover:text-foreground transition-colors">Twitter</a></li>
              <li><a href={`mailto:${settings?.contactEmail || "hello@example.com"}`} className="hover:text-foreground transition-colors">Contact</a></li>
              <li><Link href="/admin" className="hover:text-foreground transition-colors">Admin Dashboard</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
