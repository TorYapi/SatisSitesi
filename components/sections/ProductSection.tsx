import { useState, useEffect } from "react";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  currency: string;
  is_on_sale: boolean;
  discount_value: number;
  discount_type: string;
  category_id: string;
  brand_id: string;
  is_active: boolean;
  product_images?: Array<{
    image_url: string;
    is_primary: boolean;
  }>;
  product_variants?: Array<{
    price: number;
    stock_quantity: number;
  }>;
}

const ProductSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('currency_code, rate_to_try')
        .eq('effective_date', today);

      if (error) throw error;

      const rates: {[key: string]: number} = {};
      data?.forEach(rate => {
        rates[rate.currency_code] = rate.rate_to_try;
      });
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_products')
        .select(`
          *,
          products:product_id (
            *,
            product_images(image_url, is_primary),
            product_variants(price, stock_quantity)
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match the expected Product interface
      const transformedProducts = (data || []).map((item: any) => ({
        ...item.products,
        product_images: item.products.product_images,
        product_variants: item.products.product_variants
      }));
      
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (productId: string) => {
    await toggleFavorite(productId);
  };

  const getProductImage = (product: Product) => {
    const primaryImage = product.product_images?.find(img => img.is_primary);
    return primaryImage?.image_url || product.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  const getProductPrice = (product: Product) => {
    if (product.product_variants && product.product_variants.length > 0) {
      return Math.min(...product.product_variants.map(v => v.price));
    }
    return product.base_price;
  };

  const calculateTryPrice = (price: number, currency: string) => {
    if (currency === 'TRY') return price;
    const rate = exchangeRates[currency];
    return rate ? price * rate : price;
  };

  const formatPriceDisplay = (product: Product) => {
    const price = getProductPrice(product);
    const tryPrice = calculateTryPrice(price, product.currency);
    
    if (product.currency === 'TRY') {
      return `₺${price.toFixed(2)}`;
    } else {
      const currencySymbol = product.currency === 'USD' ? '$' : 
                           product.currency === 'EUR' ? '€' : 
                           product.currency === 'GBP' ? '£' : product.currency;
      return (
        <div className="flex flex-col">
          <span className="font-bold text-primary">
            {currencySymbol}{price.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            ₺{tryPrice.toLocaleString('tr-TR')}
          </span>
        </div>
      );
    }
  };

  const getDiscountedPrice = (product: Product) => {
    const price = getProductPrice(product);
    if (!product.is_on_sale || !product.discount_value) return price;
    
    if (product.discount_type === 'percentage') {
      return price * (1 - product.discount_value / 100);
    } else {
      return price - product.discount_value;
    }
  };

  const getTotalStock = (product: Product) => {
    if (!product.product_variants || product.product_variants.length === 0) return 0;
    return product.product_variants.reduce((total, variant) => total + variant.stock_quantity, 0);
  };

  if (loading) {
    return (
      <section id="products" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Ürünler yükleniyor...</p>
          </div>
        </div>
      </section>
    );
  }

  const addToCart = (productId: string) => {
    console.log(`Added product ${productId} to cart`);
    // Here you would typically dispatch to a cart state or call an API
  };

  const quickView = (productId: string) => {
    console.log(`Quick view for product ${productId}`);
    // Here you would open a modal or navigate to product detail
  };

  return (
    <section id="products" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Öne Çıkan{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ürünler
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            En popüler ve en çok tercih edilen ürünlerimizi keşfedin. Özel fırsatlar ve kampanyalardan yararlanın.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length > 0 ? products.map((product) => {
            const currentPrice = getDiscountedPrice(product);
            const originalPrice = getProductPrice(product);
            
            return (
              <Link key={product.id} to={`/products/${product.id}`}>
                <Card className="group hover:shadow-elegant transition-all duration-300 border-0 shadow-card bg-gradient-card overflow-hidden cursor-pointer">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.is_on_sale && product.discount_value && (
                        <Badge className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white border-0">
                          -{product.discount_value}%
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white text-black border-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleLike(product.id);
                          }}
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              isFavorite(product.id) 
                                ? 'fill-red-500 text-red-500' 
                                : ''
                            }`} 
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white text-black border-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(product.id);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white text-black border-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            quickView(product.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {product.currency === 'TRY' ? (
                            <>
                              <span className="font-bold text-primary">
                                ₺{currentPrice.toFixed(2)}
                              </span>
                              {product.is_on_sale && originalPrice > currentPrice && (
                                <span className="text-xs text-muted-foreground line-through">
                                  ₺{originalPrice.toFixed(2)}
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">
                                  {product.currency === 'USD' ? '$' : 
                                   product.currency === 'EUR' ? '€' : 
                                   product.currency === 'GBP' ? '£' : product.currency}
                                  {currentPrice.toFixed(2)}
                                </span>
                                {product.is_on_sale && originalPrice > currentPrice && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    {product.currency === 'USD' ? '$' : 
                                     product.currency === 'EUR' ? '€' : 
                                     product.currency === 'GBP' ? '£' : product.currency}
                                    {originalPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                ₺{calculateTryPrice(currentPrice, product.currency).toLocaleString('tr-TR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className={getTotalStock(product) === 0 ? "text-red-500 font-medium" : ""}>
                          Stok: {getTotalStock(product)}
                        </span>
                        {getTotalStock(product) === 0 && (
                          <Badge variant="destructive" className="text-xs py-0">
                            Tükendi
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          }) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Henüz ürün eklenmemiş.</p>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="gradient" 
            size="lg"
            className="hover-lift"
            onClick={() => navigate('/products')}
          >
            Tüm Ürünleri Görüntüle
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;