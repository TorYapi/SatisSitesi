import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Heart, ShoppingCart, Star, Minus, Plus, Share2, Truck, Shield, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  is_on_sale: boolean;
  discount_value: number;
  discount_type: string;
  currency: string;
  tags: string[];
  brands?: {
    name: string;
    logo_url: string;
  };
  categories?: {
    name: string;
  };
  product_images: {
    image_url: string;
    alt_text: string;
    is_primary: boolean;
  }[];
  product_variants: {
    id: string;
    sku: string;
    price: number;
    stock_quantity: number;
    colors?: {
      name: string;
      hex_code: string;
    };
    sizes?: {
      name: string;
      display_name: string;
    };
  }[];
}

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  user_id: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart: addItemToCart } = useCart();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
      checkIfFavorite();
      fetchExchangeRates();
    }
  }, [id, user]);

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

  const calculateTryPrice = (price: number, currency: string) => {
    if (currency === 'TRY') return price;
    const rate = exchangeRates[currency];
    return rate ? price * rate : price;
  };

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brands:brand_id(name, logo_url),
          categories:category_id(name),
          product_images(*),
          product_variants(
            *,
            colors:color_id(name, hex_code),
            sizes:size_id(name, display_name)
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      
      setProduct(data);
      if (data.product_variants.length > 0) {
        setSelectedVariant(data.product_variants[0].id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Hata",
        description: "Ürün bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkIfFavorite = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .single();

      if (data) {
        setIsFavorite(true);
      }
    } catch (error) {
      // Not found is expected if not in favorites
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        
        if (error) throw error;
        setIsFavorite(false);
        toast({
          title: "Başarılı",
          description: "Ürün favorilerden kaldırıldı.",
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{
            user_id: user.id,
            product_id: id,
          }]);
        
        if (error) throw error;
        setIsFavorite(true);
        toast({
          title: "Başarılı",
          description: "Ürün favorilere eklendi.",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşlem gerçekleştirilemedi.",
        variant: "destructive",
      });
    }
  };

  const addToCart = async () => {
    if (!selectedVariant) {
      toast({
        title: "Hata",
        description: "Lütfen bir varyant seçin.",
        variant: "destructive",
      });
      return;
    }

    if (!product || !id) return;

    try {
      await addItemToCart(id, selectedVariant, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const calculateDiscountedPrice = (price: number) => {
    if (!product?.is_on_sale || !product.discount_value) return price;
    
    if (product.discount_type === 'percentage') {
      return price - (price * product.discount_value / 100);
    } else {
      return price - product.discount_value;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Ürün bulunamadı</h1>
        </div>
      </div>
    );
  }

  const selectedVariantData = product.product_variants.find(v => v.id === selectedVariant);
  const finalPrice = selectedVariantData ? calculateDiscountedPrice(selectedVariantData.price) : product.base_price;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={product.product_images[selectedImageIndex]?.image_url || '/placeholder.svg'}
                alt={product.product_images[selectedImageIndex]?.alt_text || product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.product_images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.product_images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={image.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.brands && (
                  <span className="text-sm text-muted-foreground">{product.brands.name}</span>
                )}
                {product.categories && (
                  <Badge variant="secondary">{product.categories.name}</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(averageRating))}
                  <span className="text-sm text-muted-foreground">
                    ({reviews.length} değerlendirme)
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {product.currency === 'TRY' ? (
                  <>
                    <span className="text-3xl font-bold text-primary">
                      ₺{finalPrice.toLocaleString('tr-TR')}
                    </span>
                    {product.is_on_sale && selectedVariantData && (
                      <span className="text-xl text-muted-foreground line-through">
                        ₺{selectedVariantData.price.toLocaleString('tr-TR')}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-primary">
                        {product.currency === 'USD' ? '$' : 
                         product.currency === 'EUR' ? '€' : 
                         product.currency === 'GBP' ? '£' : product.currency}
                        {finalPrice.toLocaleString('tr-TR')}
                      </span>
                      {product.is_on_sale && selectedVariantData && (
                        <span className="text-xl text-muted-foreground line-through">
                          {product.currency === 'USD' ? '$' : 
                           product.currency === 'EUR' ? '€' : 
                           product.currency === 'GBP' ? '£' : product.currency}
                          {selectedVariantData.price.toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      ₺{calculateTryPrice(finalPrice, product.currency).toLocaleString('tr-TR')} TL karşılığı
                    </div>
                  </div>
                )}
              </div>
              {product.is_on_sale && (
                <Badge className="bg-destructive">
                  %{product.discount_value} İndirim
                </Badge>
              )}
              <p className="text-sm text-muted-foreground">KDV Dahil</p>
            </div>

            {/* Variants */}
            {product.product_variants.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Seçenekler:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {product.product_variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={`p-3 border rounded-lg text-left ${
                          selectedVariant === variant.id
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {variant.colors?.name} {variant.sizes?.display_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Stok: {variant.stock_quantity}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Adet:</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={selectedVariantData ? quantity >= selectedVariantData.stock_quantity : false}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={addToCart}
                className="flex-1"
                size="lg"
                variant="gradient"
                disabled={!selectedVariantData || selectedVariantData.stock_quantity === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Sepete Ekle
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={toggleFavorite}
                className={isFavorite ? "text-red-500 border-red-500" : ""}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-sm font-medium">Ücretsiz Teslimat</div>
                <div className="text-xs text-muted-foreground">10.000 TL üzeri</div>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-sm font-medium">Güvenli Ödeme</div>
                <div className="text-xs text-muted-foreground">SSL korumalı</div>
              </div>
              <div className="text-center">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="text-sm font-medium">Kolay İade</div>
                <div className="text-xs text-muted-foreground">7 gün (üründen ürüne değişiklik gösterebilmektedir)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Açıklama</TabsTrigger>
            <TabsTrigger value="reviews">Değerlendirmeler ({reviews.length})</TabsTrigger>
            <TabsTrigger value="specifications">Özellikler</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="prose prose-gray max-w-none">
                  <p>{product.description || "Ürün açıklaması henüz eklenmemiş."}</p>
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Etiketler:</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          {renderStars(review.rating)}
                          {review.title && (
                            <h4 className="font-medium mt-1">{review.title}</h4>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">Henüz değerlendirme yapılmamış.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">SKU:</span>
                    <span className="ml-2 text-muted-foreground">
                      {selectedVariantData?.sku || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Stok:</span>
                    <span className="ml-2 text-muted-foreground">
                      {selectedVariantData?.stock_quantity || 0} adet
                    </span>
                  </div>
                  {product.brands && (
                    <div>
                      <span className="font-medium">Marka:</span>
                      <span className="ml-2 text-muted-foreground">{product.brands.name}</span>
                    </div>
                  )}
                  {product.categories && (
                    <div>
                      <span className="font-medium">Kategori:</span>
                      <span className="ml-2 text-muted-foreground">{product.categories.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;