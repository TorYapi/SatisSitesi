import { useState, useEffect } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  currency: string;
  category_id: string;
  brand_id: string;
  product_images: {
    image_url: string;
    is_primary: boolean;
  }[];
  product_variants: {
    price: number;
    stock_quantity: number;
  }[];
  categories?: {
    name: string;
  };
  brands?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Filters {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  sortBy: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    brands: [],
    priceRange: [0, 250000],
    sortBy: "name"
  });
  const [maxPrice, setMaxPrice] = useState(250000);

  const getMaxPrice = (products: Product[]): number => {
    if (products.length === 0) return 1000;
    return Math.max(...products.map(p => {
      const price = p.product_variants?.[0]?.price || p.base_price;
      return calculateTryPrice(price, p.currency);
    }));
  };

  const getTotalStock = (product: Product) => {
    if (!product.product_variants || product.product_variants.length === 0) return 0;
    return product.product_variants.reduce((total, variant) => total + variant.stock_quantity, 0);
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchExchangeRates();
      await fetchProducts();
      await fetchCategories();
      await fetchBrands();
    };
    initializeData();
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

  const calculateTryPrice = (price: number, currency: string) => {
    if (currency === 'TRY') return price;
    const rate = exchangeRates[currency];
    return rate ? price * rate : price;
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (image_url, is_primary),
          product_variants (price, stock_quantity),
          categories (name),
          brands (name)
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      
      const productsData = data || [];
      setProducts(productsData);
      
      // Calculate max price for slider - convert all to TRY
      const prices = productsData.map(p => {
        const variantPrice = p.product_variants?.[0]?.price || p.base_price;
        const priceInTry = calculateTryPrice(variantPrice, p.currency);
        // Fallback if exchange rate not ready
        return isNaN(priceInTry) ? variantPrice : priceInTry;
      });
      const calculatedMaxPrice = Math.min(Math.max(...prices, 250000), 250000);
      setMaxPrice(250000);
      setFilters(prev => ({ ...prev, priceRange: [0, 250000] }));
      
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true);
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .eq('is_active', true);
      
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    // Text search
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = filters.categories.length === 0 || 
      filters.categories.includes(product.category_id);
    
    // Brand filter
    const matchesBrand = filters.brands.length === 0 || 
      (product.brand_id && filters.brands.includes(product.brand_id));
    
    // Price filter - convert to TRY for comparison
    const productPrice = product.product_variants?.[0]?.price || product.base_price;
    const productPriceInTry = calculateTryPrice(productPrice, product.currency);
    const matchesPrice = productPriceInTry >= filters.priceRange[0] && 
      productPriceInTry <= filters.priceRange[1];
    
    return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-low':
        const priceA = a.product_variants?.[0]?.price || a.base_price;
        const priceB = b.product_variants?.[0]?.price || b.base_price;
        const priceATry = calculateTryPrice(priceA, a.currency);
        const priceBTry = calculateTryPrice(priceB, b.currency);
        return priceATry - priceBTry;
      case 'price-high':
        const priceA2 = a.product_variants?.[0]?.price || a.base_price;
        const priceB2 = b.product_variants?.[0]?.price || b.base_price;
        const priceA2Try = calculateTryPrice(priceA2, a.currency);
        const priceB2Try = calculateTryPrice(priceB2, b.currency);
        return priceB2Try - priceA2Try;
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, categoryId]
        : prev.categories.filter(id => id !== categoryId)
    }));
  };

  const handleBrandChange = (brandId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      brands: checked 
        ? [...prev.brands, brandId]
        : prev.brands.filter(id => id !== brandId)
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 250000],
      sortBy: "name"
    });
    setSearchTerm("");
  };

  const getActiveFiltersCount = () => {
    return filters.categories.length + filters.brands.length + 
      (filters.priceRange[0] > 0 || filters.priceRange[1] < 250000 ? 1 : 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-80 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Tüm Ürünler</h1>
          <p className="text-muted-foreground mb-6">
            {filteredProducts.length} ürün bulundu
          </p>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">İsme göre</SelectItem>
                  <SelectItem value="price-low">Fiyat (Düşük-Yüksek)</SelectItem>
                  <SelectItem value="price-high">Fiyat (Yüksek-Düşük)</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrele
                    {getActiveFiltersCount() > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 bg-background border shadow-lg z-50" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Filtreler</h3>
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Temizle
                      </Button>
                    </div>

                    {/* Categories */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Kategoriler</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={filters.categories.includes(category.id)}
                              onCheckedChange={(checked) => 
                                handleCategoryChange(category.id, checked as boolean)
                              }
                            />
                            <Label
                              htmlFor={`category-${category.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {category.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Brands */}
                    {brands.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Markalar</Label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {brands.map((brand) => (
                            <div key={brand.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`brand-${brand.id}`}
                                checked={filters.brands.includes(brand.id)}
                                onCheckedChange={(checked) => 
                                  handleBrandChange(brand.id, checked as boolean)
                                }
                              />
                              <Label
                                htmlFor={`brand-${brand.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {brand.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price Range */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Fiyat Aralığı: {filters.priceRange[0]} - {filters.priceRange[1]} TL
                      </Label>
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value) => 
                          setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))
                        }
                        max={maxPrice}
                        min={0}
                        step={100}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0 TL</span>
                        <span>{maxPrice} TL</span>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Ürün bulunamadı</h2>
            <p className="text-muted-foreground">
              Arama kriterlerinizi değiştirip tekrar deneyin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const primaryImage = product.product_images?.find(img => img.is_primary);
              const price = product.product_variants?.[0]?.price || product.base_price;
              
              return (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={primaryImage?.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.description}
                      </p>
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           {product.currency === 'TRY' ? (
                             <span className="text-xl font-bold text-primary">
                               ₺{price.toFixed(2)}
                             </span>
                           ) : (
                             <div className="flex flex-col">
                               <span className="text-lg font-bold text-primary">
                                 {product.currency === 'USD' ? '$' : 
                                  product.currency === 'EUR' ? '€' : 
                                  product.currency === 'GBP' ? '£' : product.currency}
                                 {price.toFixed(2)}
                               </span>
                               <span className="text-sm text-muted-foreground">
                                 ₺{calculateTryPrice(price, product.currency).toLocaleString('tr-TR')}
                               </span>
                             </div>
                           )}
                         </div>
                       </div>
                       
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-sm">
                           <span className={getTotalStock(product) === 0 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                             Stok: {getTotalStock(product)}
                           </span>
                           {getTotalStock(product) === 0 && (
                             <Badge variant="destructive" className="text-xs py-0">
                               Tükendi
                             </Badge>
                           )}
                         </div>
                         <Link to={`/product/${product.id}`}>
                           <Button size="sm">
                             Görüntüle
                           </Button>
                         </Link>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Products;