import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface FavoriteItem {
  id: string;
  product_id: string;
  created_at: string;
  products: {
    name: string;
    base_price: number;
    currency: string;
    product_images: {
      image_url: string;
      alt_text: string;
    }[];
  };
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // First, get favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('id, product_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (favoritesError) throw favoritesError;

      if (!favoritesData || favoritesData.length === 0) {
        setFavorites([]);
        return;
      }

      // Get product IDs from favorites
      const productIds = favoritesData.map(fav => fav.product_id);

      // Then, get product details for these favorites
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          base_price,
          currency,
          product_images (
            image_url,
            alt_text
          )
        `)
        .in('id', productIds);

      if (productsError) throw productsError;

      // Combine favorites with product data
      const favoritesWithProducts = favoritesData.map(favorite => {
        const product = productsData?.find(p => p.id === favorite.product_id);
        return {
          ...favorite,
          products: {
            name: product?.name || '',
            base_price: product?.base_price || 0,
            currency: product?.currency || 'TRY',
            product_images: product?.product_images || []
          }
        };
      });

      setFavorites(favoritesWithProducts);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Hata",
        description: "Favoriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (productId: string) => {
    if (!user) {
      toast({
        title: "Hata",
        description: "Favorilere eklemek için giriş yapmalısınız.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: productId });

      if (error) throw error;

      await fetchFavorites();
      toast({
        title: "Başarılı",
        description: "Ürün favorilere eklendi.",
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        title: "Hata",
        description: "Favorilere eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const removeFromFavorites = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      await fetchFavorites();
      toast({
        title: "Başarılı",
        description: "Ürün favorilerden kaldırıldı.",
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast({
        title: "Hata",
        description: "Favorilerden kaldırılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some(fav => fav.product_id === productId);
  };

  const toggleFavorite = async (productId: string) => {
    if (isFavorite(productId)) {
      await removeFromFavorites(productId);
    } else {
      await addToFavorites(productId);
    }
  };

  return {
    favorites,
    loading,
    totalFavorites: favorites.length,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    fetchFavorites
  };
};