import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, Package, FolderTree, Users, ShoppingCart, Megaphone, Settings, Menu, LogOut, Home, Percent, TrendingUp, Star } from "lucide-react";
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    signOut
  } = useAuth();
  const location = useLocation();
  const navigation = [{
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard
  }, {
    name: "Ürünler",
    href: "/admin/products",
    icon: Package
  }, {
    name: "Öne Çıkan Ürünler",
    href: "/admin/featured-products",
    icon: Star
  }, {
    name: "Döviz Kurları",
    href: "/admin/exchange-rates",
    icon: TrendingUp
  }, {
    name: "İndirimler",
    href: "/admin/discounts",
    icon: Percent
  }, {
    name: "Kategoriler",
    href: "/admin/categories",
    icon: FolderTree
  }, {
    name: "Siparişler",
    href: "/admin/orders",
    icon: ShoppingCart
  }, {
    name: "Kullanıcılar",
    href: "/admin/users",
    icon: Users
  }, {
    name: "Kampanyalar",
    href: "/admin/campaigns",
    icon: Megaphone
  }, {
    name: "Ayarlar",
    href: "/admin/settings",
    icon: Settings
  }];
  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };
  const SidebarContent = () => <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Panel
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map(item => {
        const Icon = item.icon;
        return <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>;
      })}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link to="/">
          <Button variant="outline" className="w-full justify-start">
            <Home className="h-4 w-4 mr-2" />
            Ana Siteye Dön
          </Button>
        </Link>
        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Çıkış Yap
        </Button>
      </div>
    </div>;
  return <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold">Admin Panel</span>
        </div>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-card border-r">
          <SidebarContent />
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1 p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>;
};
export default AdminLayout;