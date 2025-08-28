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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Percent,
  Calendar,
  Tag,
  CheckSquare,
  Square
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  base_price: number;
  currency: string;
  is_active: boolean;
  is_on_sale: boolean;
  discount_type?: string;
  discount_value?: number;
  discount_start_date?: string;
  discount_end_date?: string;
  created_at: string;
  categories?: { name: string };
  brands?: { name: string };
  product_variants: { stock_quantity: number }[];
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

const DiscountsAdmin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "with_discount" | "without_discount">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isMultiDiscountDialogOpen, setIsMultiDiscountDialogOpen] = useState(false);
  const [isBulkDiscountDialogOpen, setIsBulkDiscountDialogOpen] = useState(false);
  const [multiDiscountForms, setMultiDiscountForms] = useState<Record<string, {type: string, value: string, startDate: string, endDate: string}>>({});
  const [discountForm, setDiscountForm] = useState({
    type: "percentage",
    value: "",
    startDate: "",
    endDate: ""
  });
  const [bulkDiscountForm, setBulkDiscountForm] = useState({
    type: "percentage",
    value: "",
    startDate: "",
    endDate: "",
    applyTo: "category",
    categoryId: "",
    brandId: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

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
            product_variants(stock_quantity)
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

  const applyDiscount = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          discount_type: discountForm.type,
          discount_value: parseFloat(discountForm.value),
          discount_start_date: discountForm.startDate || null,
          discount_end_date: discountForm.endDate || null
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      await fetchData();
      setIsDiscountDialogOpen(false);
      setDiscountForm({ type: "percentage", value: "", startDate: "", endDate: "" });
      setSelectedProduct(null);

      toast({
        title: "Başarılı",
        description: "İndirim başarıyla uygulandı.",
      });
    } catch (error) {
      console.error('Error applying discount:', error);
      toast({
        title: "Hata",
        description: "İndirim uygulanırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const applyBulkDiscount = async () => {
    try {
      let query = supabase.from('products').select('id');
      
      if (bulkDiscountForm.applyTo === "category" && bulkDiscountForm.categoryId) {
        query = query.eq('category_id', bulkDiscountForm.categoryId);
      } else if (bulkDiscountForm.applyTo === "brand" && bulkDiscountForm.brandId) {
        query = query.eq('brand_id', bulkDiscountForm.brandId);
      }

      const { data: targetProducts, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      if (!targetProducts || targetProducts.length === 0) {
        toast({
          title: "Uyarı",
          description: "Seçilen kriterlere uygun ürün bulunamadı.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('products')
        .update({
          discount_type: bulkDiscountForm.type,
          discount_value: parseFloat(bulkDiscountForm.value),
          discount_start_date: bulkDiscountForm.startDate || null,
          discount_end_date: bulkDiscountForm.endDate || null
        })
        .in('id', targetProducts.map(p => p.id));

      if (error) throw error;

      await fetchData();
      setIsBulkDiscountDialogOpen(false);
      setBulkDiscountForm({
        type: "percentage",
        value: "",
        startDate: "",
        endDate: "",
        applyTo: "category",
        categoryId: "",
        brandId: ""
      });

      toast({
        title: "Başarılı",
        description: `${targetProducts.length} ürüne toplu indirim uygulandı.`,
      });
    } catch (error) {
      console.error('Error applying bulk discount:', error);
      toast({
        title: "Hata",
        description: "Toplu indirim uygulanırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const openMultiDiscountDialog = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen önce ürün seçin.",
        variant: "destructive",
      });
      return;
    }

    // Initialize forms for selected products
    const initialForms: Record<string, {type: string, value: string, startDate: string, endDate: string}> = {};
    selectedProducts.forEach(productId => {
      const product = products.find(p => p.id === productId);
      initialForms[productId] = {
        type: product?.discount_type || "percentage",
        value: product?.discount_value?.toString() || "",
        startDate: product?.discount_start_date ? new Date(product.discount_start_date).toISOString().split('T')[0] : "",
        endDate: product?.discount_end_date ? new Date(product.discount_end_date).toISOString().split('T')[0] : ""
      };
    });
    setMultiDiscountForms(initialForms);
    setIsMultiDiscountDialogOpen(true);
  };

  const updateMultiDiscountForm = (productId: string, field: string, value: string) => {
    setMultiDiscountForms(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const applyMultiDiscounts = async () => {
    try {
      const updates = selectedProducts.map(productId => {
        const form = multiDiscountForms[productId];
        return supabase
          .from('products')
          .update({
            discount_type: form.type,
            discount_value: parseFloat(form.value) || null,
            discount_start_date: form.startDate || null,
            discount_end_date: form.endDate || null
          })
          .eq('id', productId);
      });

      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Bazı ürünler güncellenemedi');
      }

      await fetchData();
      setIsMultiDiscountDialogOpen(false);
      setSelectedProducts([]);
      setMultiDiscountForms({});

      toast({
        title: "Başarılı",
        description: `${selectedProducts.length} ürüne indirim uygulandı.`,
      });
    } catch (error) {
      console.error('Error applying multi discounts:', error);
      toast({
        title: "Hata",
        description: "İndirimler uygulanırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const removeDiscount = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          discount_type: null,
          discount_value: null,
          discount_start_date: null,
          discount_end_date: null
        })
        .eq('id', productId);

      if (error) throw error;

      await fetchData();
      toast({
        title: "Başarılı",
        description: "İndirim kaldırıldı.",
      });
    } catch (error) {
      console.error('Error removing discount:', error);
      toast({
        title: "Hata",
        description: "İndirim kaldırılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const openDiscountDialog = (product: Product) => {
    setSelectedProduct(product);
    setDiscountForm({
      type: product.discount_type || "percentage",
      value: product.discount_value?.toString() || "",
      startDate: product.discount_start_date ? new Date(product.discount_start_date).toISOString().split('T')[0] : "",
      endDate: product.discount_end_date ? new Date(product.discount_end_date).toISOString().split('T')[0] : ""
    });
    setIsDiscountDialogOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filter === "all" || 
      (filter === "with_discount" && product.is_on_sale) ||
      (filter === "without_discount" && !product.is_on_sale);

    return matchesSearch && matchesFilter;
  });

  const getDiscountDisplay = (product: Product) => {
    if (!product.discount_value) return "-";
    
    if (product.discount_type === "percentage") {
      return `%${product.discount_value}`;
    } else {
      return `${product.discount_value} ${product.currency}`;
    }
  };

  const isDiscountActive = (product: Product) => {
    if (!product.discount_start_date && !product.discount_end_date) return true;
    
    const now = new Date();
    const startDate = product.discount_start_date ? new Date(product.discount_start_date) : null;
    const endDate = product.discount_end_date ? new Date(product.discount_end_date) : null;
    
    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;
    
    return true;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">İndirim Yönetimi</h1>
            <p className="text-muted-foreground">Ürün indirimlerini yönetin</p>
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
          <h1 className="text-3xl font-bold">İndirim Yönetimi</h1>
          <p className="text-muted-foreground">
            Toplam {products.length} ürün, {filteredProducts.length} gösteriliyor
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBulkDiscountDialogOpen} onOpenChange={setIsBulkDiscountDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Tag className="h-4 w-4 mr-2" />
                Toplu İndirim
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Toplu İndirim Uygula</DialogTitle>
                <DialogDescription>
                  Seçilen kategoriye veya markaya toplu indirim uygulayın.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="applyTo">Uygulama Kriteri</Label>
                  <Select
                    value={bulkDiscountForm.applyTo}
                    onValueChange={(value) => setBulkDiscountForm(prev => ({ ...prev, applyTo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">Kategoriye Göre</SelectItem>
                      <SelectItem value="brand">Markaya Göre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bulkDiscountForm.applyTo === "category" && (
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Kategori</Label>
                    <Select
                      value={bulkDiscountForm.categoryId}
                      onValueChange={(value) => setBulkDiscountForm(prev => ({ ...prev, categoryId: value }))}
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
                )}

                {bulkDiscountForm.applyTo === "brand" && (
                  <div className="space-y-2">
                    <Label htmlFor="brandId">Marka</Label>
                    <Select
                      value={bulkDiscountForm.brandId}
                      onValueChange={(value) => setBulkDiscountForm(prev => ({ ...prev, brandId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Marka seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="discountType">İndirim Tipi</Label>
                  <Select
                    value={bulkDiscountForm.type}
                    onValueChange={(value) => setBulkDiscountForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="fixed">Sabit Tutar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">İndirim Değeri</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    placeholder={bulkDiscountForm.type === "percentage" ? "10" : "50"}
                    value={bulkDiscountForm.value}
                    onChange={(e) => setBulkDiscountForm(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={bulkDiscountForm.startDate}
                      onChange={(e) => setBulkDiscountForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Bitiş Tarihi</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={bulkDiscountForm.endDate}
                      onChange={(e) => setBulkDiscountForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsBulkDiscountDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button onClick={applyBulkDiscount}>
                    Toplu İndirim Uygula
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            onClick={openMultiDiscountDialog}
            disabled={selectedProducts.length === 0}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Seçili Ürünlere İndirim ({selectedProducts.length})
          </Button>
        </div>
      </div>

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
                { key: "with_discount", label: "İndirimli" },
                { key: "without_discount", label: "İndirimsiz" },
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
              <TableHead className="w-12">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllProducts}
                  className="h-8 w-8 p-0"
                >
                  {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead>Ürün</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Marka</TableHead>
              <TableHead>Orijinal Fiyat</TableHead>
              <TableHead>İndirim</TableHead>
              <TableHead>İndirim Tarihleri</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleProductSelection(product.id)}
                    className="h-8 w-8 p-0"
                  >
                    {selectedProducts.includes(product.id) ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{product.name}</div>
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
                  <span className="font-medium">
                    {product.base_price.toLocaleString('tr-TR')} {product.currency}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{getDiscountDisplay(product)}</span>
                    {product.discount_value && (
                      <Badge 
                        variant={isDiscountActive(product) ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {isDiscountActive(product) ? "Aktif" : "Pasif"}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {product.discount_start_date && (
                      <div>Başlangıç: {new Date(product.discount_start_date).toLocaleDateString('tr-TR')}</div>
                    )}
                    {product.discount_end_date && (
                      <div>Bitiş: {new Date(product.discount_end_date).toLocaleDateString('tr-TR')}</div>
                    )}
                    {!product.discount_start_date && !product.discount_end_date && product.discount_value && (
                      <div>Süresiz</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={product.is_on_sale ? "default" : "secondary"}
                  >
                    {product.is_on_sale ? "İndirimli" : "Normal"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openDiscountDialog(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {product.discount_value && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeDiscount(product.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
              : "Henüz ürün bulunmuyor."}
          </div>
        )}
      </Card>

      {/* Discount Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>İndirim Düzenle</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} için indirim ayarlarını düzenleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discountType">İndirim Tipi</Label>
              <Select
                value={discountForm.type}
                onValueChange={(value) => setDiscountForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Yüzde (%)</SelectItem>
                  <SelectItem value="fixed">Sabit Tutar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountValue">İndirim Değeri</Label>
              <Input
                id="discountValue"
                type="number"
                placeholder={discountForm.type === "percentage" ? "10" : "50"}
                value={discountForm.value}
                onChange={(e) => setDiscountForm(prev => ({ ...prev, value: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={discountForm.startDate}
                  onChange={(e) => setDiscountForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Bitiş Tarihi</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={discountForm.endDate}
                  onChange={(e) => setDiscountForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={applyDiscount}>
                İndirim Uygula
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi Discount Dialog */}
      <Dialog open={isMultiDiscountDialogOpen} onOpenChange={setIsMultiDiscountDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seçili Ürünlere İndirim Uygula</DialogTitle>
            <DialogDescription>
              {selectedProducts.length} ürün için ayrı ayrı indirim ayarları yapın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedProducts.map((productId) => {
              const product = products.find(p => p.id === productId);
              const form = multiDiscountForms[productId] || { type: "percentage", value: "", startDate: "", endDate: "" };
              
              return (
                <Card key={productId}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{product?.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>İndirim Tipi</Label>
                        <Select
                          value={form.type}
                          onValueChange={(value) => updateMultiDiscountForm(productId, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Yüzde (%)</SelectItem>
                            <SelectItem value="fixed">Sabit Tutar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>İndirim Değeri</Label>
                        <Input
                          type="number"
                          placeholder={form.type === "percentage" ? "10" : "50"}
                          value={form.value}
                          onChange={(e) => updateMultiDiscountForm(productId, 'value', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Başlangıç Tarihi</Label>
                        <Input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => updateMultiDiscountForm(productId, 'startDate', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Bitiş Tarihi</Label>
                        <Input
                          type="date"
                          value={form.endDate}
                          onChange={(e) => updateMultiDiscountForm(productId, 'endDate', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Orijinal Fiyat: {product?.base_price.toLocaleString('tr-TR')} {product?.currency}
                      {form.value && (
                        <span className="ml-2">
                          → İndirimli Fiyat: {
                            form.type === "percentage" 
                              ? (product!.base_price * (1 - parseFloat(form.value) / 100)).toLocaleString('tr-TR')
                              : (product!.base_price - parseFloat(form.value)).toLocaleString('tr-TR')
                          } {product?.currency}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsMultiDiscountDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={applyMultiDiscounts}>
                Tüm İndirimleri Uygula
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscountsAdmin;