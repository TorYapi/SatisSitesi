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
  FolderTree,
  Eye
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  parent_id: string | null;
  created_at: string;
  children?: Category[];
  products_count?: number;
}

const CategoriesAdmin = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    parent_id: "none",
    sort_order: "0",
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Organize categories in a hierarchical structure
      const categoriesWithChildren = organizeCategories(data || []);
      setCategories(categoriesWithChildren);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Hata",
        description: "Kategoriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const organizeCategories = (cats: Category[]): Category[] => {
    const categoryMap = new Map();
    const result: Category[] = [];

    // First, create a map of all categories
    cats.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Then, organize them hierarchically
    cats.forEach(cat => {
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(categoryMap.get(cat.id));
        }
      } else {
        result.push(categoryMap.get(cat.id));
      }
    });

    return result;
  };

  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !currentStatus })
        .eq('id', categoryId);

      if (error) throw error;

      await fetchCategories();
      toast({
        title: "Başarılı",
        description: `Kategori ${!currentStatus ? 'aktif' : 'pasif'} duruma getirildi.`,
      });
    } catch (error) {
      console.error('Error updating category status:', error);
      toast({
        title: "Hata",
        description: "Kategori durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      await fetchCategories();
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla silindi.",
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Hata",
        description: "Kategori silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const flattenCategories = (cats: Category[], level: number = 0): (Category & { level: number })[] => {
    const result: (Category & { level: number })[] = [];
    
    cats.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, level + 1));
      }
    });
    
    return result;
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      parent_id: category.parent_id || "none",
      sort_order: category.sort_order.toString(),
      is_active: category.is_active
    });
    setIsEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedCategory(null);
    setCategoryForm({
      name: "",
      slug: "",
      description: "",
      image_url: "",
      parent_id: "none",
      sort_order: "0",
      is_active: true
    });
    setIsCreateDialogOpen(true);
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
    setCategoryForm(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const saveCategory = async () => {
    try {
      const categoryData = {
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description || null,
        image_url: categoryForm.image_url || null,
        parent_id: categoryForm.parent_id === "none" ? null : categoryForm.parent_id,
        sort_order: parseInt(categoryForm.sort_order),
        is_active: categoryForm.is_active
      };

      if (selectedCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', selectedCategory.id);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Kategori başarıyla güncellendi.",
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Kategori başarıyla oluşturuldu.",
        });
      }

      await fetchCategories();
      setIsEditDialogOpen(false);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Hata",
        description: "Kategori kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getAllCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result.push(...getAllCategories(cat.children));
      }
    });
    return result;
  };

  const filteredCategories = flattenCategories(categories).filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Kategori Yönetimi</h1>
            <p className="text-muted-foreground">Kategorileri yönetin ve düzenleyin</p>
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
          <h1 className="text-3xl font-bold">Kategori Yönetimi</h1>
          <p className="text-muted-foreground">
            Toplam {categories.length} ana kategori
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Kategori Ara</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Kategori ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Sıralama</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturulma</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <FolderTree className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div 
                        className="font-medium flex items-center gap-2"
                        style={{ paddingLeft: `${category.level * 20}px` }}
                      >
                        {category.level > 0 && (
                          <span className="text-muted-foreground">└─</span>
                        )}
                        {category.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.slug}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">
                    {category.description || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {category.sort_order}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={category.is_active ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleCategoryStatus(category.id, category.is_active)}
                  >
                    {category.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {new Date(category.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteCategory(category.id)}
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
        
        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm 
              ? "Arama kriterlerinize uygun kategori bulunamadı." 
              : "Henüz kategori eklenmemiş."}
          </div>
        )}
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kategori Düzenle</DialogTitle>
            <DialogDescription>
              {selectedCategory?.name} kategorisini düzenleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Kategori Adı</Label>
              <Input
                id="name"
                value={categoryForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Kategori adı"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Kısa Adı</Label>
              <Input
                id="slug"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="kategori-adi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kategori açıklaması"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Ana Kategori</Label>
              <Select
                value={categoryForm.parent_id}
                onValueChange={(value) => setCategoryForm(prev => ({ ...prev, parent_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ana kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ana Kategori Yok</SelectItem>
                  {getAllCategories(categories)
                    .filter(cat => cat.id !== selectedCategory?.id)
                    .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sıralama</Label>
              <Input
                id="sortOrder"
                type="number"
                value={categoryForm.sort_order}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, sort_order: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Resim URL</Label>
              <Input
                id="imageUrl"
                value={categoryForm.image_url}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={saveCategory}>
                Güncelle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kategori Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir kategori oluşturun.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newName">Kategori Adı</Label>
              <Input
                id="newName"
                value={categoryForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Kategori adı"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newSlug">URL Kısa Adı</Label>
              <Input
                id="newSlug"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="kategori-adi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newDescription">Açıklama</Label>
              <Textarea
                id="newDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kategori açıklaması"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newParent">Ana Kategori</Label>
              <Select
                value={categoryForm.parent_id}
                onValueChange={(value) => setCategoryForm(prev => ({ ...prev, parent_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ana kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ana Kategori Yok</SelectItem>
                  {getAllCategories(categories).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newSortOrder">Sıralama</Label>
              <Input
                id="newSortOrder"
                type="number"
                value={categoryForm.sort_order}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, sort_order: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newImageUrl">Resim URL</Label>
              <Input
                id="newImageUrl"
                value={categoryForm.image_url}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={saveCategory}>
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesAdmin;