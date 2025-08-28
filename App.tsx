import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Favorites from "./pages/Favorites";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Campaigns from "./pages/Campaigns";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Orders from "./pages/Orders";
import AdminLayout from "./components/admin/AdminLayout";
import AdminGuard from "./components/admin/AdminGuard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import ExchangeRatesAdmin from "./pages/admin/ExchangeRatesAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import DiscountsAdmin from "./pages/admin/DiscountsAdmin";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin";
import CampaignsAdmin from "./pages/admin/CampaignsAdmin";
import OrdersAdmin from "./pages/admin/OrdersAdmin";
import FeaturedProductsAdmin from "./pages/admin/FeaturedProductsAdmin";
import AdminSettings from "./pages/admin/AdminSettings";
import MaintenanceOverlay from "./components/MaintenanceOverlay";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Initialize theme on app start
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
  const root = window.document.documentElement;
  
  if (savedTheme) {
    if (savedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(savedTheme);
    }
  }
};

// Initialize theme immediately
initializeTheme();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <MaintenanceOverlay />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/admin/*" element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<ProductsAdmin />} />
              <Route path="featured-products" element={<FeaturedProductsAdmin />} />
              <Route path="exchange-rates" element={<ExchangeRatesAdmin />} />
              <Route path="users" element={<UsersAdmin />} />
              <Route path="discounts" element={<DiscountsAdmin />} />
              <Route path="categories" element={<CategoriesAdmin />} />
              <Route path="campaigns" element={<CampaignsAdmin />} />
              <Route path="orders" element={<OrdersAdmin />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
