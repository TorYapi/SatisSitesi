-- Sipariş onaylandığında stok düşürme fonksiyonu
CREATE OR REPLACE FUNCTION public.update_stock_on_order_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Sadece status 'pending' veya başka bir durumdan 'confirmed' olduğunda çalış
  IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    -- Bu siparişin tüm ürünleri için stok düşür
    UPDATE public.product_variants 
    SET stock_quantity = stock_quantity - order_items.quantity
    FROM public.order_items
    WHERE order_items.order_id = NEW.id 
      AND order_items.variant_id = product_variants.id
      AND product_variants.stock_quantity >= order_items.quantity;
    
    -- Eğer stok yetersizse error fırlat
    IF EXISTS (
      SELECT 1 
      FROM public.order_items oi
      JOIN public.product_variants pv ON pv.id = oi.variant_id
      WHERE oi.order_id = NEW.id 
        AND pv.stock_quantity < oi.quantity
    ) THEN
      RAISE EXCEPTION 'Yetersiz stok! Sipariş onaylanamaz.';
    END IF;
    
    RAISE NOTICE 'Sipariş % onaylandı ve stoklar güncellendi', NEW.order_number;
  END IF;
  
  -- Sipariş iptal edildiğinde stok geri ekle
  IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    UPDATE public.product_variants 
    SET stock_quantity = stock_quantity + order_items.quantity
    FROM public.order_items
    WHERE order_items.order_id = NEW.id 
      AND order_items.variant_id = product_variants.id;
      
    RAISE NOTICE 'Sipariş % iptal edildi ve stoklar geri eklendi', NEW.order_number;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger oluştur
CREATE TRIGGER trigger_update_stock_on_order_confirmation
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_order_confirmation();