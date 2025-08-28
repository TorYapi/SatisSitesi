import { useState } from "react";
import { Search, ShoppingCart, User, Heart, Menu, X, LogOut, Settings, Shield, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    user,
    loading,
    isAdmin,
    signOut
  } = useAuth();
  const {
    items
  } = useCart();
  const {
    totalFavorites
  } = useFavorites();
  const navigation = [{
    name: "Ana Sayfa",
    href: "/"
  }, {
    name: "Ürünler",
    href: "/products"
  }, {
    name: "Kategoriler",
    href: "/categories"
  }, {
    name: "Kampanyalar",
    href: "/campaigns"
  }, {
    name: "Hakkımızda",
    href: "/about"
  }, {
    name: "İletişim",
    href: "/contact"
  }];
  return <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-3xl">T</span>
              </div>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text sm:text-xl font-extrabold text-purple-700 text-left text-xl">TORSHOP    </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map(item => <Link key={item.name} to={item.href} className="text-sm font-medium text-muted-foreground hover:text-primary link-underline transition-colors">
                {item.name}
              </Link>)}
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Ürün ara..." className="pl-9 pr-4 bg-muted/30 border-0 focus-visible:ring-1" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Link to="/favorites">
              <Button variant="ghost" size="icon" className="relative hover-lift">
                <Heart className="h-5 w-5" />
                {totalFavorites > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-destructive">
                    {totalFavorites}
                  </Badge>}
              </Button>
            </Link>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative hover-lift">
                <ShoppingCart className="h-5 w-5" />
                {items.length > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-primary">
                    {items.length}
                  </Badge>}
              </Button>
            </Link>
            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="hover-lift">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <Link to="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profilim</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/orders">
                    <DropdownMenuItem className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Siparişlerim</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/favorites">
                    <DropdownMenuItem className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Favorilerim</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/settings">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Ayarlar</span>
                    </DropdownMenuItem>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin">
                      <DropdownMenuItem className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Çıkış Yap</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Link to="/auth">
                <Button variant="outline" size="icon" className="hover-lift">
                  <User className="h-5 w-5" />
                </Button>
              </Link>}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <div className="md:hidden border-t py-4 space-y-2">
            {navigation.map(item => <Link key={item.name} to={item.href} className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>
                {item.name}
              </Link>)}
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Ürün ara..." className="pl-9 pr-4 bg-muted/30 border-0" />
              </div>
            </div>
          </div>}
      </div>
    </header>;
};
export default Header;