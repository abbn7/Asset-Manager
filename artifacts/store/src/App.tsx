import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { StorefrontLayout } from "@/components/layout/storefront-layout";
import { AdminLayout } from "@/components/layout/admin-layout";

import HomePage from "@/pages/storefront/home";
import ProductsListPage from "@/pages/storefront/products-list";
import ProductDetailPage from "@/pages/storefront/product-detail";
import CollectionsPage from "@/pages/storefront/collections";
import CollectionDetailPage from "@/pages/storefront/collection-detail";
import CartPage from "@/pages/storefront/cart";
import CheckoutPage from "@/pages/storefront/checkout";
import OrdersPage from "@/pages/storefront/orders";
import OrderDetailPage from "@/pages/storefront/order-detail";
import SearchPage from "@/pages/storefront/search";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminProductsList from "@/pages/admin/products-list";
import AdminProductForm from "@/pages/admin/product-form";
import AdminCollectionsList from "@/pages/admin/collections-list";
import AdminCollectionForm from "@/pages/admin/collection-form";
import AdminOrdersList from "@/pages/admin/orders-list";
import AdminOrderDetail from "@/pages/admin/order-detail";
import AdminCustomersList from "@/pages/admin/customers-list";
import AdminDiscountsList from "@/pages/admin/discounts-list";
import AdminDiscountNew from "@/pages/admin/discount-new";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminSettings from "@/pages/admin/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/admin" nest>
        <AdminLayout>
          <Switch>
            <Route path="/" component={AdminDashboard} />
            <Route path="/products/new">
              <AdminProductForm mode="new" />
            </Route>
            <Route path="/products/:id">
              <AdminProductForm mode="edit" />
            </Route>
            <Route path="/products" component={AdminProductsList} />
            <Route path="/collections/new">
              <AdminCollectionForm mode="new" />
            </Route>
            <Route path="/collections/:id">
              <AdminCollectionForm mode="edit" />
            </Route>
            <Route path="/collections" component={AdminCollectionsList} />
            <Route path="/orders/:id" component={AdminOrderDetail} />
            <Route path="/orders" component={AdminOrdersList} />
            <Route path="/customers" component={AdminCustomersList} />
            <Route path="/discounts/new" component={AdminDiscountNew} />
            <Route path="/discounts" component={AdminDiscountsList} />
            <Route path="/analytics" component={AdminAnalytics} />
            <Route path="/settings" component={AdminSettings} />
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </Route>

      <Route path="/" nest>
        <StorefrontLayout>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/products" component={ProductsListPage} />
            <Route path="/products/:slug" component={ProductDetailPage} />
            <Route path="/collections" component={CollectionsPage} />
            <Route path="/collections/:slug" component={CollectionDetailPage} />
            <Route path="/cart" component={CartPage} />
            <Route path="/checkout" component={CheckoutPage} />
            <Route path="/orders/:id" component={OrderDetailPage} />
            <Route path="/orders" component={OrdersPage} />
            <Route path="/search" component={SearchPage} />
            <Route component={NotFound} />
          </Switch>
        </StorefrontLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
