import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { generateSecureSessionId, secureLog, rateLimiter } from '@/lib/security';
import { useErrorHandler } from '@/lib/error-handler';

interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  products: {
    name: string;
    base_price: number;
    currency: string;
    product_images: { image_url: string; alt_text: string }[];
  };
  product_variants: {
    id: string;
    price: number;
    sku: string;
    colors?: { name: string; hex_code: string };
    sizes?: { name: string; display_name: string };
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  totalItems: number;
  totalPrice: number;
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const SecureCartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  // Generate or get session ID for guest users with secure storage
  const getSessionId = () => {
    const storageKey = 'cart_session_id';
    let sessionId = sessionStorage.getItem(storageKey); // Use sessionStorage instead of localStorage
    
    if (!sessionId) {
      sessionId = generateSecureSessionId();
      sessionStorage.setItem(storageKey, sessionId);
      
      // Add session timeout (24 hours)
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
      sessionStorage.setItem(`${storageKey}_expiry`, expiryTime.toString());
    } else {
      // Check if session has expired
      const expiryTime = sessionStorage.getItem(`${storageKey}_expiry`);
      if (expiryTime && Date.now() > parseInt(expiryTime)) {
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem(`${storageKey}_expiry`);
        return getSessionId(); // Generate new session
      }
    }
    
    return sessionId;
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      
      // Set session context for guest users
      if (!user) {
        const sessionId = getSessionId();
        await supabase.rpc('set_config', { 
          setting_name: 'app.session_id', 
          new_value: sessionId, 
          is_local: true 
        });
      }
      
      // Get or create cart
      const cartId = await getOrCreateCart();
      if (!cartId) return;

      // Fetch cart items
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products!inner(name, base_price, currency, product_images(image_url, alt_text)),
          product_variants!inner(
            id, price, sku,
            colors:color_id(name, hex_code),
            sizes:size_id(name, display_name)
          )
        `)
        .eq('cart_id', cartId);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      const appError = handleError(error, 'fetchCart');
      toast({
        title: "Hata",
        description: appError.userMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrCreateCart = async (): Promise<string | null> => {
    try {
      // Set session context for guest users
      if (!user) {
        const sessionId = getSessionId();
        await supabase.rpc('set_config', { 
          setting_name: 'app.session_id', 
          new_value: sessionId, 
          is_local: true 
        });
      }
      
      const identifier = user ? { user_id: user.id } : { session_id: getSessionId() };
      
      // Try to find existing cart
      const { data: existingCart, error: findError } = await supabase
        .from('cart')
        .select('id')
        .match(identifier)
        .single();

      if (existingCart) {
        return existingCart.id;
      }

      // Create new cart if not found
      const { data: newCart, error: createError } = await supabase
        .from('cart')
        .insert([identifier])
        .select('id')
        .single();

      if (createError) throw createError;
      return newCart.id;
    } catch (error) {
      const appError = handleError(error, 'getOrCreateCart');
      secureLog('Cart creation failed', { error: appError.message });
      return null;
    }
  };

  const addToCart = async (productId: string, variantId: string, quantity: number = 1) => {
    // Rate limiting
    if (!rateLimiter.isAllowed('addToCart', 10, 60000)) {
      toast({
        title: "Uyarı",
        description: "Çok hızlı işlem yapıyorsunuz. Lütfen bekleyin.",
        variant: "destructive",
      });
      return;
    }

    // Input validation
    if (!productId || !variantId || quantity <= 0 || quantity > 99) {
      toast({
        title: "Hata",
        description: "Geçersiz ürün bilgileri.",
        variant: "destructive",
      });
      return;
    }

    try {
      const cartId = await getOrCreateCart();
      if (!cartId) return;

      // Check if item already exists in cart
      const existingItem = items.find(item => 
        item.product_id === productId && item.variant_id === variantId
      );

      if (existingItem) {
        // Update quantity
        await updateQuantity(existingItem.id, Math.min(existingItem.quantity + quantity, 99));
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert([{
            cart_id: cartId,
            product_id: productId,
            variant_id: variantId,
            quantity: Math.min(quantity, 99),
          }]);

        if (error) throw error;
        await fetchCart();
        
        toast({
          title: "Başarılı",
          description: "Ürün sepete eklendi.",
        });
      }
    } catch (error) {
      const appError = handleError(error, 'addToCart');
      toast({
        title: "Hata",
        description: appError.userMessage,
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    // Validate quantity
    if (quantity > 99) {
      toast({
        title: "Uyarı",
        description: "Maksimum 99 adet ekleyebilirsiniz.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
      
      // Update local state
      setItems(items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    } catch (error) {
      const appError = handleError(error, 'updateQuantity');
      toast({
        title: "Hata",
        description: appError.userMessage,
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      setItems(items.filter(item => item.id !== itemId));
      
      toast({
        title: "Başarılı",
        description: "Ürün sepetten kaldırıldı.",
      });
    } catch (error) {
      const appError = handleError(error, 'removeFromCart');
      toast({
        title: "Hata",
        description: appError.userMessage,
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    try {
      const cartId = await getOrCreateCart();
      if (!cartId) return;

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) throw error;
      
      setItems([]);
      toast({
        title: "Başarılı",
        description: "Sepet temizlendi.",
      });
    } catch (error) {
      const appError = handleError(error, 'clearCart');
      toast({
        title: "Hata",
        description: appError.userMessage,
        variant: "destructive",
      });
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => 
    sum + (item.product_variants.price * item.quantity), 0
  );

  const value = {
    items,
    loading,
    totalItems,
    totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useSecureCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useSecureCart must be used within a SecureCartProvider');
  }
  return context;
};