import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  ArrowUp,
  ArrowDown,
  Eye
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeaturedProduct {
  id: string;
  product_id: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  products: {
    id: string;
    name: string;
    base_price: number;
    currency: string;
    product_images: { image_url: string; is_primary: boolean }[];
  };
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  currency: string;
  product_images: { image_url: string; is_primary: boolean }[];
}

const FeaturedProductsAdmin = () => {
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchFeaturedProducts();
    fetchAllProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_products')
        .select(`
          *,
          products:product_id (
            id,
            name,
            base_price,
            currency,
            product_images (image_url, is_primary)
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFeaturedProducts((data as any) || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      toast({
        title: "Hata",
        description: "Öne çıkan ürünler yüklenirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const fetchAllProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          base_price,
          currency,
          product_images (image_url, is_primary)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAllProducts((data as any) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFeaturedProduct = async () => {
    if (!selectedProductId) return;

    try {
      // Get the highest sort_order and add 1
      const maxSortOrder = featuredProducts.length > 0 
        ? Math.max(...featuredProducts.map(fp => fp.sort_order)) 
        : 0;

      const { error } = await supabase
        .from('featured_products')
        .insert([{
          product_id: selectedProductId,
          sort_order: maxSortOrder + 1,
          is_active: true,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      await fetchFeaturedProducts();
      setIsAddDialogOpen(false);
      setSelectedProductId("");
      
      toast({
        title: "Başarılı",
        description: "Ürün öne çıkanlar listesine eklendi.",
      });
    } catch (error: any) {
      console.error('Error adding featured product:', error);
      toast({
        title: "Hata",
        description: error.message === 'duplicate key value violates unique constraint "featured_products_product_id_key"' 
          ? "Bu ürün zaten öne çıkanlar listesinde."
          : "Ürün eklenirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const removeFeaturedProduct = async (id: string) => {
    if (!confirm('Bu ürünü öne çıkanlar listesinden kaldırmak istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('featured_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchFeaturedProducts();
      toast({
        title: "Başarılı",
        description: "Ürün öne çıkanlar listesinden kaldırıldı.",
      });
    } catch (error) {
      console.error('Error removing featured product:', error);
      toast({
        title: "Hata",
        description: "Ürün kaldırılırken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const updateSortOrder = async (id: string, newSortOrder: number) => {
    try {
      const { error } = await supabase
        .from('featured_products')
        .update({ sort_order: newSortOrder })
        .eq('id', id);

      if (error) throw error;

      await fetchFeaturedProducts();
    } catch (error) {
      console.error('Error updating sort order:', error);
      toast({
        title: "Hata",
        description: "Sıralama güncellenirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    
    const currentItem = featuredProducts[index];
    const previousItem = featuredProducts[index - 1];
    
    updateSortOrder(currentItem.id, previousItem.sort_order);
    updateSortOrder(previousItem.id, currentItem.sort_order);
  };

  const moveDown = (index: number) => {
    if (index === featuredProducts.length - 1) return;
    
    const currentItem = featuredProducts[index];
    const nextItem = featuredProducts[index + 1];
    
    updateSortOrder(currentItem.id, nextItem.sort_order);
    updateSortOrder(nextItem.id, currentItem.sort_order);
  };

  const getProductImage = (product: any) => {
    const primaryImage = product.product_images?.find((img: any) => img.is_primary);
    return primaryImage?.image_url || product.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺';
    return `${symbol}${price.toFixed(2)}`;
  };

  // Filter out already featured products from the selection list
  const availableProducts = allProducts.filter(
    product => !featuredProducts.some(fp => fp.product_id === product.id)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Öne Çıkan Ürünler</h1>
            <p className="text-muted-foreground">Ana sayfada gösterilecek öne çıkan ürünleri yönetin</p>
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
          <h1 className="text-3xl font-bold">Öne Çıkan Ürünler</h1>
          <p className="text-muted-foreground">
            Ana sayfada gösterilecek öne çıkan ürünleri yönetin ({featuredProducts.length} ürün)
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ürün Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Öne Çıkan Ürün Ekle</DialogTitle>
              <DialogDescription>
                Ana sayfada gösterilecek ürünü seçin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Ürün seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {formatPrice(product.base_price, product.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={addFeaturedProduct} disabled={!selectedProductId}>
                  Ekle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Öne Çıkan Ürünler Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {featuredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz öne çıkan ürün eklenmemiş.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featuredProducts.map((featuredProduct, index) => (
                  <TableRow key={featuredProduct.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{index + 1}</span>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveDown(index)}
                            disabled={index === featuredProducts.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={getProductImage(featuredProduct.products)}
                            alt={featuredProduct.products.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{featuredProduct.products.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(featuredProduct.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatPrice(featuredProduct.products.base_price, featuredProduct.products.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFeaturedProduct(featuredProduct.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeaturedProductsAdmin;