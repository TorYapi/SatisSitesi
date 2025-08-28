import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, CreditCard, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

const Footer = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const quickLinks = [{
    name: "Ana Sayfa",
    href: "/"
  }, {
    name: "Ürünler",
    href: "/products"
  }, {
    name: "Hakkımızda",
    href: "/about"
  }, {
    name: "İletişim",
    href: "/contact"
  }, {
    name: "Favorilerim",
    href: "/favorites"
  }, {
    name: "Sepetim",
    href: "/cart"
  }];

  const fetchCategories = async () => {
    try {
      console.log('Kategoriler yükleniyor...');
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Kategori yükleme hatası:', error);
        return;
      }

      console.log('Yüklenen kategoriler:', data);
      setCategories(data || []);
    } catch (error) {
      console.error('Kategori fetch hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  const socialLinks = [{
    icon: Facebook,
    href: "#",
    name: "Facebook"
  }, {
    icon: Twitter,
    href: "#",
    name: "Twitter"
  }, {
    icon: Instagram,
    href: "#",
    name: "Instagram"
  }, {
    icon: Youtube,
    href: "#",
    name: "Youtube"
  }];
  return <footer className="bg-muted/30 border-t">
      {/* Features section */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Ücretsiz Teslimat</h3>
                <p className="text-sm text-muted-foreground">10.000 TL üzeri siparişlerde</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Güvenli Ödeme</h3>
                <p className="text-sm text-muted-foreground">SSL korumalı ödeme</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Kolay İade</h3>
                <p className="text-sm text-muted-foreground">7 gün içinde iade hakkı 
(Üründen ürüne değişiklik gösterebilmektedir.)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-3xl">T</span>
              </div>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-xl font-extrabold text-purple-700 text-left">
                TORSHOP
              </span>
            </div>
            <p className="text-muted-foreground">
              Premium alışveriş deneyimi sunan, güvenilir ve kaliteli ürünlerin tek adresi. 
              Müşteri memnuniyeti bizim önceliğimiz.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Lefkoşa, Kıbrıs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Mersin, Türkiye</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span>+90 (212) 555 0123</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@shopzone.com</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Hızlı Linkler</h3>
            <ul className="space-y-2">
              {quickLinks.map(link => <li key={link.name}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary transition-colors link-underline text-sm block">
                    {link.name}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Kategoriler</h3>
            {loading ? (
              <ul className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="h-4 bg-muted/30 rounded animate-pulse" />
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                {categories.map(category => <li key={category.id}>
                    <Link to={`/categories/${category.slug}`} className="text-muted-foreground hover:text-primary transition-colors link-underline text-sm">
                      {category.name}
                    </Link>
                  </li>)}
              </ul>
            )}
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Bülten</h3>
            <p className="text-muted-foreground text-sm">
              Özel fırsatlar ve yeni ürünlerden haberdar olmak için bültenimize abone olun.
            </p>
            <div className="flex gap-2">
              <Input placeholder="E-posta adresiniz" className="flex-1" />
              <Button variant="gradient">
                Abone Ol
              </Button>
            </div>
            <div className="flex gap-4">
              {socialLinks.map(social => {
              const IconComponent = social.icon;
              return <Button key={social.name} variant="ghost" size="icon" className="hover:text-primary hover-lift" asChild>
                    <a href={social.href} aria-label={social.name}>
                      <IconComponent className="w-5 h-5" />
                    </a>
                  </Button>;
            })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2025 TORSHOP. Tüm hakları saklıdır.</p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Güvenli ödeme:</span>
              <div className="flex gap-2">
                <div className="w-8 h-5 bg-muted rounded text-xs flex items-center justify-center font-bold">
                  VISA
                </div>
                <div className="w-8 h-5 bg-muted rounded text-xs flex items-center justify-center font-bold">
                  MC
                </div>
                <div className="w-8 h-5 bg-muted rounded text-xs flex items-center justify-center font-bold">
                  TROY
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;