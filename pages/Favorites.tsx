import { useState, useEffect } from "react";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";

const Favorites = () => {
  const { user } = useAuth();
  const { favorites, loading, removeFromFavorites } = useFavorites();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Favorilerim</h1>
            <p className="text-muted-foreground mb-4">
              Favorilerinizi görüntülemek için giriş yapmanız gerekiyor.
            </p>
            <Link to="/auth">
              <Button>Giriş Yap</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
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
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Favorilerim</h1>
            <p className="text-muted-foreground">
              {favorites.length} favori ürün
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Henüz favori ürününüz yok</h2>
            <p className="text-muted-foreground mb-4">
              Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca bulabilirsiniz.
            </p>
            <Link to="/">
              <Button>Ürünleri Keşfet</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={favorite.products?.product_images?.[0]?.image_url || "/placeholder.svg"}
                      alt={favorite.products?.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 hover:text-red-600"
                      onClick={() => removeFromFavorites(favorite.product_id)}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <Link to={`/product/${favorite.product_id}`}>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {favorite.products?.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">
                          {favorite.products?.base_price} {favorite.products?.currency}
                        </span>
                      </div>
                      <Link to={`/product/${favorite.product_id}`}>
                        <Button size="sm">
                          Görüntüle
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Favorites;