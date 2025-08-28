import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Minus, Plus, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, totalItems, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('currency_code, rate_to_try')
        .eq('effective_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      const rates: Record<string, number> = {};
      data?.forEach(rate => {
        rates[rate.currency_code] = rate.rate_to_try;
      });
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  const calculateTryPrice = (price: number, currency: string) => {
    if (currency === 'TRY') return price;
    const rate = exchangeRates[currency] || 1;
    return price * rate;
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => {
      const originalPrice = item.products?.base_price || item.product_variants?.price || 0;
      const currency = item.products?.currency || 'TRY';
      const tryPrice = calculateTryPrice(originalPrice, currency);
      return total + (tryPrice * item.quantity);
    }, 0);
  };

  const totalPrice = getCartTotal();

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Lütfen bir kupon kodu girin");
      return;
    }

    setCouponLoading(true);
    try {
      // Kupon kodu doğrulama simülasyonu
      // Gerçek uygulamada Supabase'den kupon doğrulaması yapılacak
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (couponCode.toLowerCase() === "indirim10") {
        setAppliedCoupon({
          code: couponCode,
          discount: 10,
          type: "percentage"
        });
        toast.success("Kupon kodu başarıyla uygulandı!");
      } else {
        toast.error("Geçersiz kupon kodu");
      }
    } catch (error) {
      toast.error("Kupon kodu uygulanırken hata oluştu");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.success("Kupon kodu kaldırıldı");
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percentage") {
      return (totalPrice * appliedCoupon.discount) / 100;
    }
    return appliedCoupon.discount;
  };

  const finalTotal = totalPrice - calculateDiscount();

  const handleCheckout = () => {
    if (!user) {
      toast.error("Ödeme işlemi için giriş yapmanız gerekiyor");
      navigate("/auth", { state: { from: "/cart" } });
      return;
    }

    if (items.length === 0) {
      toast.error("Sepetiniz boş");
      return;
    }

    // Iyzico ödeme işlemi için checkout sayfasına yönlendir
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sepetim</h1>
          <p className="text-muted-foreground">
            {totalItems} ürün sepetinizde
          </p>
        </div>

        {items.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sepetiniz boş</h2>
              <p className="text-muted-foreground mb-6">
                Alışverişe başlamak için ürünlere göz atın
              </p>
              <Link to="/">
                <Button>Alışverişe Başla</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sepet Ürünleri */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden">
                        {item.products?.product_images?.[0] ? (
                          <img
                            src={item.products.product_images[0].image_url}
                            alt={item.products.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.products?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.product_variants?.colors && `Renk: ${item.product_variants.colors.name}`} 
                          {item.product_variants?.sizes && ` • Beden: ${item.product_variants.sizes.display_name}`}
                        </p>
                        <div className="space-y-1">
                          <p className="font-semibold text-primary">
                            {((item.products?.base_price || item.product_variants?.price || 0) * item.quantity).toFixed(2)} {item.products?.currency || 'TRY'}
                          </p>
                          {item.products?.currency && item.products.currency !== 'TRY' && (
                            <p className="text-sm text-muted-foreground">
                              ≈ {(calculateTryPrice(item.products.base_price || item.product_variants?.price || 0, item.products.currency) * item.quantity).toFixed(2)} TL
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {(item.products?.base_price || item.product_variants?.price || 0).toFixed(2)} {item.products?.currency || 'TRY'} × {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sipariş Özeti */}
            <div className="space-y-6">
              {/* Kupon Kodu */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Tag className="h-5 w-5" />
                    <span>Kupon Kodu</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appliedCoupon ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div>
                          <p className="font-semibold text-green-700 dark:text-green-400">
                            {appliedCoupon.code}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-500">
                            %{appliedCoupon.discount} indirim uygulandı
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeCoupon}
                          className="text-green-700 hover:text-green-800 dark:text-green-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        placeholder="Kupon kodunuzu girin"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button
                        onClick={applyCoupon}
                        disabled={couponLoading}
                        className="w-full"
                        variant="outline"
                      >
                        {couponLoading ? "Uygulanıyor..." : "Kupon Uygula"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sipariş Özeti */}
              <Card>
                <CardHeader>
                  <CardTitle>Sipariş Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Ürün bazında özet */}
                  <div className="space-y-2">
                    {items.map((item) => {
                      const originalPrice = item.products?.base_price || item.product_variants?.price || 0;
                      const currency = item.products?.currency || 'TRY';
                      const tryPrice = calculateTryPrice(originalPrice, currency);
                      
                      return (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate max-w-[200px]">
                            {item.products?.name} × {item.quantity}
                          </span>
                          <div className="text-right">
                            <div className="font-medium">
                              {(originalPrice * item.quantity).toFixed(2)} {currency}
                            </div>
                            {currency !== 'TRY' && (
                              <div className="text-xs text-muted-foreground">
                                ≈ {(tryPrice * item.quantity).toFixed(2)} TL
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span>Ara Toplam (TL)</span>
                    <span>{totalPrice.toFixed(2)} TL</span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>İndirim ({appliedCoupon.code})</span>
                      <span>-{calculateDiscount().toFixed(2)} TL</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Kargo</span>
                    <span>Ücretsiz</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Toplam</span>
                    <span>{finalTotal.toFixed(2)} TL</span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full"
                    size="lg"
                  >
                    {!user ? "Giriş Yap ve Ödeme Yap" : "Ödeme Yap"}
                  </Button>

                  {!user && (
                    <p className="text-sm text-muted-foreground text-center">
                      Ödeme işlemi için giriş yapmanız gerekiyor
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Cart;