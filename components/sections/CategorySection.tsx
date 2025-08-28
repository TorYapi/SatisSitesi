import { useEffect, useState } from "react";
import { Shirt, Smartphone, Home, Gamepad2, Book, Watch, Car, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  products_count?: number;
}

const CategorySection = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .limit(8);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRandomIcon = (index: number) => {
    const icons = [Shirt, Smartphone, Home, Gamepad2, Book, Watch, Car, Heart];
    return icons[index % icons.length];
  };

  const getRandomColor = (index: number) => {
    const colors = [
      "from-pink-500 to-rose-500",
      "from-blue-500 to-cyan-500", 
      "from-green-500 to-emerald-500",
      "from-purple-500 to-violet-500",
      "from-amber-500 to-orange-500",
      "from-indigo-500 to-blue-500",
      "from-gray-600 to-gray-800",
      "from-red-500 to-pink-500"
    ];
    return colors[index % colors.length];
  };

  const getRandomBackground = (index: number) => {
    const backgrounds = [
      "bg-gradient-to-br from-pink-100 to-rose-100",
      "bg-gradient-to-br from-blue-100 to-cyan-100",
      "bg-gradient-to-br from-green-100 to-emerald-100", 
      "bg-gradient-to-br from-purple-100 to-violet-100",
      "bg-gradient-to-br from-amber-100 to-orange-100",
      "bg-gradient-to-br from-indigo-100 to-blue-100",
      "bg-gradient-to-br from-gray-100 to-gray-200",
      "bg-gradient-to-br from-red-100 to-pink-100"
    ];
    return backgrounds[index % backgrounds.length];
  };

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to category page or filter products
    console.log(`Navigating to category ${categoryId}`);
  };

  if (loading) {
    return (
      <section id="categories" className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Kategoriler yükleniyor...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categories" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Popüler{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Kategoriler
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Binlerce ürün arasından size en uygun olanları bulun. Her kategoride kaliteli ve uygun fiyatlı seçenekler.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.length > 0 ? categories.map((category, index) => {
            const IconComponent = getRandomIcon(index);
            const color = getRandomColor(index);
            const background = getRandomBackground(index);
            
            return (
              <Card 
                key={category.id} 
                className="group cursor-pointer border-0 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 bg-gradient-card"
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden group-hover:scale-110 transition-transform duration-300">
                    {category.image_url ? (
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="w-full h-full object-cover rounded-2xl"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full ${background} flex items-center justify-center ${category.image_url ? 'hidden' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {category.products_count || 0} ürün
                  </p>
                </CardContent>
              </Card>
            );
          }) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Henüz kategori eklenmemiş.</p>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg"
            className="hover-lift"
            onClick={() => console.log('View all categories')}
          >
            Tüm Kategorileri Görüntüle
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;