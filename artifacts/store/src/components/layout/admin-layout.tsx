import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Tags, 
  BarChart, 
  Settings,
  LogOut,
  Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/collections", label: "Collections", icon: Folder },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/discounts", label: "Discounts", icon: Tags },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-background border-r flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/admin" className="font-serif font-bold text-xl tracking-wider uppercase">
            Maison Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/admin");
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${isActive ? "font-medium" : "text-muted-foreground"}`}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" asChild>
            <Link href="/">
              <LogOut className="h-4 w-4 mr-3" />
              View Store
            </Link>
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="h-16 border-b bg-background flex items-center justify-between px-6 shrink-0">
          <div className="font-medium text-sm text-muted-foreground">
            {navItems.find(i => location === i.href || (location.startsWith(i.href) && i.href !== "/admin"))?.label || "Admin"}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">Store Admin</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
