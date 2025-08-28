import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Download,
  Upload,
  X,
  Image as ImageIcon
} from "lucide-react";
import * as XLSX from 'xlsx';

interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  base_price: number;
  currency: string;
  category_id?: string;
  brand_id?: string;
  sku?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  weight?: number;
  is_active: boolean;
  is_on_sale: boolean;
  created_at: string;
  categories?: { name: string };
  brands?: { name: string };
  product_variants: { stock_quantity: number }[];
  product_images: { id?: string; image_url: string; is_primary?: boolean }[];
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface ExchangeRate {
  currency_code: string;
  rate_to_try: number;
}

const ProductsAdmin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "on_sale">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    slug: "",
    description: "",
    base_price: "",
    currency: "TRY",
    category_id: "",
    brand_id: "",
    sku: "",
    meta_title: "",
    meta_description: "",
    tags: "",
    weight: "",
    stock_quantity: "",
    is_active: true
  });
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});
  const [productImages, setProductImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{id: string, image_url: string, is_primary: boolean}[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('currency_code, rate_to_try')
        .eq('effective_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      const ratesMap: {[key: string]: number} = {};
      if (data) {
        data.forEach((rate: ExchangeRate) => {
          ratesMap[rate.currency_code] = rate.rate_to_try;
        });
      }
      setExchangeRates(ratesMap);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [productsResponse, categoriesResponse, brandsResponse] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            categories:category_id(name),
            brands:brand_id(name),
            product_variants(stock_quantity),
            product_images(id, image_url, is_primary)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('brands')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
      ]);

      if (productsResponse.error) throw productsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;
      if (brandsResponse.error) throw brandsResponse.error;

      setProducts(productsResponse.data || []);
      setCategories(categoriesResponse.data || []);
      setBrands(brandsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    setProductForm(prev => ({
      ...prev,
      name,
      slug,
      meta_title: name,
      sku: `SKU-${slug.toUpperCase()}-${Date.now().toString().slice(-4)}`
    }));
  };

  const openCreateDialog = () => {
    setProductImages([]);
    setExistingImages([]);
    setProductForm({
      name: "",
      slug: "",
      description: "",
      base_price: "",
      currency: "TRY",
      category_id: "",
      brand_id: "",
      sku: "",
      meta_title: "",
      meta_description: "",
      tags: "",
      weight: "",
      stock_quantity: "",
      is_active: true
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setProductImages([]);
    setExistingImages(product.product_images?.map(img => ({
      id: img.id || '',
      image_url: img.image_url,
      is_primary: img.is_primary || false
    })) || []);
    setProductForm({
      name: product.name,
      slug: product.slug || "",
      description: product.description || "",
      base_price: product.base_price.toString(),
      currency: product.currency,
      category_id: product.category_id || "",
      brand_id: product.brands?.name || "",
      sku: product.sku || "",
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ""),
      weight: product.weight?.toString() || "",
      stock_quantity: getTotalStock(product.product_variants).toString(),
      is_active: product.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newImages = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    setProductImages(prev => [...prev, ...newImages]);
  };

  const removeNewImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const setPrimaryImage = (imageId: string, isNew: boolean) => {
    if (isNew) {
      // For new images, we'll handle this when uploading
      return;
    } else {
      setExistingImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })));
    }
  };

  const uploadImages = async (productId: string) => {
    if (productImages.length === 0) return;

    const uploadPromises = productImages.map(async (file, index) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}-${index}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      return {
        product_id: productId,
        image_url: publicUrl,
        is_primary: index === 0 && existingImages.length === 0, // First image is primary if no existing images
        sort_order: existingImages.length + index
      };
    });

    const imageData = await Promise.all(uploadPromises);
    
    const { error } = await supabase
      .from('product_images')
      .insert(imageData);

    if (error) throw error;
  };

  const updateExistingImages = async (productId: string) => {
    if (existingImages.length === 0) return;

    const updatePromises = existingImages.map(async (image) => {
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: image.is_primary })
        .eq('id', image.id);

      if (error) throw error;
    });

    await Promise.all(updatePromises);
  };

  const calculateTryPrice = (price: number, currency: string) => {
    if (currency === 'TRY') return price;
    const rate = exchangeRates[currency];
    return rate ? price * rate : price;
  };

  const formatPriceDisplay = (product: Product) => {
    const basePrice = product.base_price;
    const currency = product.currency;
    const tryPrice = calculateTryPrice(basePrice, currency);

    if (currency === 'TRY') {
      return `₺${basePrice.toLocaleString('tr-TR')}`;
    } else {
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {currency === 'USD' ? '$' : '€'}{basePrice.toLocaleString('tr-TR')}
          </span>
          <span className="text-xs text-muted-foreground">
            ₺{tryPrice.toLocaleString('tr-TR')}
          </span>
        </div>
      );
    }
  };

  const createProduct = async () => {
    try {
      let brandId = null;
      
      // If user entered a brand name, find existing or create new
      if (productForm.brand_id && productForm.brand_id.trim() !== "") {
        const brandName = productForm.brand_id.trim();
        
        // Check if brand already exists
        const { data: existingBrand } = await supabase
          .from('brands')
          .select('id')
          .eq('name', brandName)
          .single();
        
        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          // Create new brand
          const { data: newBrand, error: brandError } = await supabase
            .from('brands')
            .insert([{
              name: brandName,
              slug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              is_active: true
            }])
            .select('id')
            .single();
          
          if (brandError) throw brandError;
          brandId = newBrand.id;
        }
      }

      const newProductData = {
        name: productForm.name,
        slug: productForm.slug,
        description: productForm.description || null,
        base_price: parseFloat(productForm.base_price),
        currency: productForm.currency,
        category_id: productForm.category_id,
        brand_id: brandId,
        sku: productForm.sku,
        meta_title: productForm.meta_title || null,
        meta_description: productForm.meta_description || null,
        tags: productForm.tags ? productForm.tags.split(',').map(tag => tag.trim()) : null,
        weight: productForm.weight ? parseFloat(productForm.weight) : null,
        is_active: productForm.is_active
      };

      const { data: createdProduct, error } = await supabase
        .from('products')
        .insert([newProductData])
        .select('id')
        .single();

      if (error) throw error;

      // Update the default variant's stock quantity
      if (productForm.stock_quantity) {
        const { error: variantError } = await supabase
          .from('product_variants')
          .update({ 
            stock_quantity: parseInt(productForm.stock_quantity),
            price: parseFloat(productForm.base_price)
          })
          .eq('product_id', createdProduct.id);

        if (variantError) throw variantError;
      }

      // Upload new images if any
      if (productImages.length > 0) {
        await uploadImages(createdProduct.id);
      }

      await fetchData();
      setIsCreateDialogOpen(false);
      setProductImages([]);
      setExistingImages([]);
      toast({
        title: "Başarılı",
        description: "Ürün başarıyla oluşturuldu.",
      });
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Hata",
        description: "Ürün oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    
    try {
      let brandId = null;
      
      // If user entered a brand name, find existing or create new
      if (productForm.brand_id && productForm.brand_id.trim() !== "") {
        const brandName = productForm.brand_id.trim();
        
        // Check if brand already exists
        const { data: existingBrand } = await supabase
          .from('brands')
          .select('id')
          .eq('name', brandName)
          .single();
        
        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          // Create new brand
          const { data: newBrand, error: brandError } = await supabase
            .from('brands')
            .insert([{
              name: brandName,
              slug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              is_active: true
            }])
            .select('id')
            .single();
          
          if (brandError) throw brandError;
          brandId = newBrand.id;
        }
      }

      const productData = {
        name: productForm.name,
        slug: productForm.slug,
        description: productForm.description || null,
        base_price: parseFloat(productForm.base_price),
        currency: productForm.currency,
        category_id: productForm.category_id,
        brand_id: brandId,
        sku: productForm.sku || null,
        meta_title: productForm.meta_title || null,
        meta_description: productForm.meta_description || null,
        tags: productForm.tags ? productForm.tags.split(',').map(tag => tag.trim()) : null,
        weight: productForm.weight ? parseFloat(productForm.weight) : null,
        is_active: productForm.is_active
      };

      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) throw error;

      // Update the product variant's stock quantity and price
      if (productForm.stock_quantity) {
        const { error: variantError } = await supabase
          .from('product_variants')
          .update({ 
            stock_quantity: parseInt(productForm.stock_quantity),
            price: parseFloat(productForm.base_price)
          })
          .eq('product_id', editingProduct.id);

        if (variantError) throw variantError;
      }

      // Upload new images if any
      if (productImages.length > 0) {
        await uploadImages(editingProduct.id);
      }

      // Update existing images if any changes
      if (existingImages.length > 0) {
        await updateExistingImages(editingProduct.id);
      }

      await fetchData();
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      setProductImages([]);
      setExistingImages([]);
      toast({
        title: "Başarılı",
        description: "Ürün başarıyla güncellendi.",
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Hata",
        description: "Ürün güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, is_active: !currentStatus }
          : product
      ));

      toast({
        title: "Başarılı",
        description: `Ürün ${!currentStatus ? 'aktif' : 'pasif'} duruma getirildi.`,
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: "Hata",
        description: "Ürün durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== productId));
      toast({
        title: "Başarılı",
        description: "Ürün başarıyla silindi.",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Hata",
        description: "Ürün silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filter === "all" || 
      (filter === "active" && product.is_active) ||
      (filter === "inactive" && !product.is_active) ||
      (filter === "on_sale" && product.is_on_sale);

    return matchesSearch && matchesFilter;
  });

  const getTotalStock = (variants: { stock_quantity: number }[]) => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce((total, variant) => total + (variant.stock_quantity || 0), 0);
  };

  const exportToExcel = () => {
    const exportData = filteredProducts.map(product => ({
      'Ürün Adı': product.name,
      'Kategori': product.categories?.name || 'Kategorisiz',
      'Marka': product.brands?.name || '-',
      'Fiyat': product.base_price,
      'Para Birimi': product.currency,
      'TL Fiyat': calculateTryPrice(product.base_price, product.currency),
      'Stok': getTotalStock(product.product_variants),
      'Durum': product.is_active ? 'Aktif' : 'Pasif',
      'İndirimli': product.is_on_sale ? 'Evet' : 'Hayır',
      'Oluşturma Tarihi': new Date(product.created_at).toLocaleDateString('tr-TR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ürünler');
    
    const fileName = `urunler_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "Başarılı",
      description: "Ürünler Excel dosyası olarak dışa aktarıldı.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Ürün Yönetimi</h1>
            <p className="text-muted-foreground">Ürünleri yönetin ve düzenleyin</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-full"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ürün Yönetimi</h1>
          <p className="text-muted-foreground">
            Toplam {products.length} ürün, {filteredProducts.length} gösteriliyor
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            İçe Aktar
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ürün
          </Button>
        </div>
      </div>

      {/* Exchange Rate Info */}
      {Object.keys(exchangeRates).length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Güncel Döviz Kurları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm">
              {exchangeRates.USD && (
                <span>USD: ₺{exchangeRates.USD.toFixed(4)}</span>
              )}
              {exchangeRates.EUR && (
                <span>EUR: ₺{exchangeRates.EUR.toFixed(4)}</span>
              )}
              <span className="text-muted-foreground">
                (Döviz kurlarını "Döviz Kurları" sayfasından güncelleyebilirsiniz)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { key: "all", label: "Tümü" },
                { key: "active", label: "Aktif" },
                { key: "inactive", label: "Pasif" },
                { key: "on_sale", label: "İndirimli" },
              ].map((filterOption) => (
                <Button
                  key={filterOption.key}
                  variant={filter === filterOption.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterOption.key as any)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {filterOption.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Marka</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                      {product.product_images[0] ? (
                        <img
                          src={product.product_images[0].image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Eye className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(product.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {product.categories?.name || "Kategorisiz"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {product.brands?.name || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {formatPriceDisplay(product)}
                    {product.is_on_sale && (
                      <Badge variant="destructive" className="text-xs">
                        İndirim
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={getTotalStock(product.product_variants) === 0 ? "text-destructive" : ""}>
                    {getTotalStock(product.product_variants)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={product.is_active ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleProductStatus(product.id, product.is_active)}
                  >
                    {product.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteProduct(product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || filter !== "all" 
              ? "Arama kriterlerinize uygun ürün bulunamadı." 
              : "Henüz ürün eklenmemiş."}
          </div>
        )}
      </Card>

      {/* Create Product Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Ürün Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir ürün oluşturun. TL fiyatı güncel kurlar kullanılarak otomatik hesaplanır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Temel Bilgiler</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Ürün Adı *</Label>
                  <Input
                    id="productName"
                    value={productForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ürün adı"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productSlug">URL Kısa Adı</Label>
                  <Input
                    id="productSlug"
                    value={productForm.slug}
                    onChange={(e) => setProductForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="urun-adi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Select
                    value={productForm.category_id}
                    onValueChange={(value) => setProductForm(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Marka</Label>
                  <Input
                    id="brand"
                    value={productForm.brand_id}
                    onChange={(e) => setProductForm(prev => ({ ...prev, brand_id: e.target.value }))}
                    placeholder="Marka adı girin"
                    list="brands-list"
                  />
                  <datalist id="brands-list">
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.name} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Para Birimi *</Label>
                  <Select
                    value={productForm.currency}
                    onValueChange={(value) => setProductForm(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Para birimi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY (Türk Lirası)</SelectItem>
                      <SelectItem value="USD">USD (Amerikan Doları)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Fiyat *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={productForm.base_price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, base_price: e.target.value }))}
                    placeholder="0.00"
                  />
                  {productForm.base_price && productForm.currency !== 'TRY' && (
                    <div className="text-sm text-muted-foreground">
                      TL Karşılığı: ₺{calculateTryPrice(parseFloat(productForm.base_price), productForm.currency).toLocaleString('tr-TR')}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={productForm.sku}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="SKU-URUN-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Ağırlık (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={productForm.weight}
                    onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stok Miktarı *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Etiketler</Label>
                  <Input
                    id="tags"
                    value={productForm.tags}
                    onChange={(e) => setProductForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="etiket1, etiket2, etiket3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ürün açıklaması"
                  rows={4}
                />
              </div>
            </div>

            {/* SEO Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">SEO Optimizasyonu</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Başlık</Label>
                  <Input
                    id="metaTitle"
                    value={productForm.meta_title}
                    onChange={(e) => setProductForm(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO için sayfa başlığı (60 karakter önerilir)"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {productForm.meta_title.length}/60 karakter
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Açıklama</Label>
                  <Textarea
                    id="metaDescription"
                    value={productForm.meta_description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="SEO için sayfa açıklaması (160 karakter önerilir)"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {productForm.meta_description.length}/160 karakter
                  </p>
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Ürün Görselleri</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productImages">Resim Ekle</Label>
                  <Input
                    id="productImages"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Birden fazla resim seçebilirsiniz. JPG, PNG, WEBP formatları desteklenmektedir.
                  </p>
                </div>

                {/* Preview selected images */}
                {productImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Seçilen Resimler</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {productImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeNewImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {index === 0 && (
                            <Badge className="absolute bottom-2 left-2 text-xs">
                              Ana Resim
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                İptal
              </Button>
              <Button 
                onClick={createProduct}
                disabled={!productForm.name || !productForm.category_id || !productForm.base_price || !productForm.stock_quantity}
              >
                Ürün Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ürünü Düzenle</DialogTitle>
            <DialogDescription>
              Ürün bilgilerini güncelleyin. TL fiyatı güncel kurlar kullanılarak otomatik hesaplanır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Temel Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Ürün Adı</Label>
                  <Input
                    id="edit-name"
                    value={productForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ürün adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">URL (Slug)</Label>
                  <Input
                    id="edit-slug"
                    value={productForm.slug}
                    onChange={(e) => setProductForm({...productForm, slug: e.target.value})}
                    placeholder="url-friendly-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Kategori</Label>
                  <Select value={productForm.category_id} onValueChange={(value) => setProductForm({...productForm, category_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-brand">Marka</Label>
                  <Input
                    id="edit-brand"
                    value={productForm.brand_id}
                    onChange={(e) => setProductForm({...productForm, brand_id: e.target.value})}
                    placeholder="Marka adı girin"
                    list="brands-list-edit"
                  />
                  <datalist id="brands-list-edit">
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.name} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sku">SKU</Label>
                  <Input
                    id="edit-sku"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    placeholder="Otomatik oluşturulacak"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-weight">Ağırlık (kg)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    step="0.1"
                    value={productForm.weight}
                    onChange={(e) => setProductForm({...productForm, weight: e.target.value})}
                    placeholder="0.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stok Miktarı</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    min="0"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Açıklama</Label>
                <Textarea
                  id="edit-description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  placeholder="Ürün açıklaması"
                  rows={3}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Fiyatlandırma</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Fiyat</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={productForm.base_price}
                    onChange={(e) => setProductForm({...productForm, base_price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Para Birimi</Label>
                  <Select value={productForm.currency} onValueChange={(value) => setProductForm({...productForm, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY (₺)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {productForm.base_price && productForm.currency !== 'TRY' && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    TL Karşılığı: ₺{calculateTryPrice(parseFloat(productForm.base_price), productForm.currency).toLocaleString('tr-TR')}
                  </p>
                </div>
              )}
            </div>

            {/* SEO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">SEO</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-meta-title">Meta Başlık</Label>
                  <Input
                    id="edit-meta-title"
                    value={productForm.meta_title}
                    onChange={(e) => setProductForm({...productForm, meta_title: e.target.value})}
                    placeholder="SEO için sayfa başlığı"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {productForm.meta_title.length}/60 karakter
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-meta-description">Meta Açıklama</Label>
                  <Textarea
                    id="edit-meta-description"
                    value={productForm.meta_description}
                    onChange={(e) => setProductForm({...productForm, meta_description: e.target.value})}
                    placeholder="SEO için sayfa açıklaması"
                    rows={2}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {productForm.meta_description.length}/160 karakter
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Etiketler</Label>
                  <Input
                    id="edit-tags"
                    value={productForm.tags}
                    onChange={(e) => setProductForm({...productForm, tags: e.target.value})}
                    placeholder="etiket1, etiket2, etiket3"
                  />
                  <p className="text-xs text-muted-foreground">
                    Virgül ile ayırın
                  </p>
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Ürün Görselleri</h3>
              
              <div className="space-y-4">
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Mevcut Resimler</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingImages.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img
                              src={image.image_url}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingImage(image.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {image.is_primary && (
                            <Badge className="absolute bottom-2 left-2 text-xs">
                              Ana Resim
                            </Badge>
                          )}
                          {!image.is_primary && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                              onClick={() => setPrimaryImage(image.id, false)}
                            >
                              Ana Yap
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Images */}
                <div className="space-y-2">
                  <Label htmlFor="editProductImages">Yeni Resim Ekle</Label>
                  <Input
                    id="editProductImages"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Yeni resimler ekleyebilirsiniz. JPG, PNG, WEBP formatları desteklenmektedir.
                  </p>
                </div>

                {/* Preview new images */}
                {productImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Eklenecek Resimler</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {productImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeNewImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Badge className="absolute bottom-2 left-2 text-xs bg-green-500">
                            Yeni
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                İptal
              </Button>
              <Button 
                onClick={updateProduct}
                disabled={!productForm.name || !productForm.category_id || !productForm.base_price}
              >
                Ürünü Güncelle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsAdmin;