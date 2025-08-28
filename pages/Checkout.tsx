import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Lock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import { AddressSelector } from "@/components/checkout/AddressSelector";

interface CheckoutAddress {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const Checkout = () => {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [shippingAddress, setShippingAddress] = useState<CheckoutAddress | null>(null);
  const [billingAddress, setBillingAddress] = useState<CheckoutAddress | null>(null);
  const [useSameAddress, setUseSameAddress] = useState(true);

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('currency_code, rate_to_try')
        .eq('effective_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      const rates: Record<string, number> = {};
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
    const rate = exchangeRates[currency] || 1;
    return price * rate;
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => {
      const originalPrice = item.products?.base_price || item.product_variants?.price || 0;
      const currency = item.products?.currency || 'TRY';
      const tryPrice = calculateTryPrice(originalPrice, currency);
      return total + (tryPrice * item.quantity);
    }, 0);
  };

  const totalPrice = getCartTotal();

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: "/checkout" } });
      return;
    }

    if (items.length === 0) {
      toast.error("Sepetinizde ürün bulunmuyor");
      navigate("/cart");
      return;
    }
  }, [user, items, navigate]);

  const createOrder = async () => {
    try {
      // Adres kontrolü
      if (!isAddressValid(shippingAddress)) {
        throw new Error("Geçerli bir teslimat adresi gerekli");
      }

      if (!useSameAddress && !isAddressValid(billingAddress)) {
        throw new Error("Geçerli bir fatura adresi gerekli");
      }

      // Önce customer kaydını kontrol et/oluştur
      let customerId;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Yeni customer oluştur
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: user?.id,
            email: user?.email || '',
            first_name: user?.user_metadata?.first_name || 'Kullanıcı',
            last_name: user?.user_metadata?.last_name || '',
          })
          .select('id')
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Sipariş oluştur - order_number manuel generate edelim
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const finalBillingAddress = useSameAddress ? shippingAddress : billingAddress;
      
      const orderData: any = {
        customer_id: customerId,
        order_number: orderNumber,
        total_amount: totalPrice,
        subtotal: totalPrice,
        status: 'pending',
        payment_status: 'pending',
        shipping_address: {
          title: shippingAddress.title,
          first_name: shippingAddress.first_name,
          last_name: shippingAddress.last_name,
          phone: shippingAddress.phone,
          address_line_1: shippingAddress.address_line_1,
          address_line_2: shippingAddress.address_line_2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal_code,
          country: shippingAddress.country,
        },
        billing_address: {
          title: finalBillingAddress!.title,
          first_name: finalBillingAddress!.first_name,
          last_name: finalBillingAddress!.last_name,
          phone: finalBillingAddress!.phone,
          address_line_1: finalBillingAddress!.address_line_1,
          address_line_2: finalBillingAddress!.address_line_2,
          city: finalBillingAddress!.city,
          state: finalBillingAddress!.state,
          postal_code: finalBillingAddress!.postal_code,
          country: finalBillingAddress!.country,
        }
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Sipariş kalemlerini oluştur
      const orderItems = items.map(item => {
        const originalPrice = item.products?.base_price || item.product_variants?.price || 0;
        const currency = item.products?.currency || 'TRY';
        const tryPrice = calculateTryPrice(originalPrice, currency);
        
        return {
          order_id: order.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: tryPrice,
          total_price: tryPrice * item.quantity
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Ödeme başarılı olduğunda sipariş durumunu güncelle
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed' as any,
          payment_status: 'paid' as any
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      return order.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  // Adres validasyonu
  const isAddressValid = (address: CheckoutAddress | null): boolean => {
    if (!address) return false;
    return !!(
      address.title?.trim() &&
      address.first_name?.trim() &&
      address.last_name?.trim() &&
      address.phone?.trim() &&
      address.address_line_1?.trim() &&
      address.city?.trim() &&
      address.postal_code?.trim()
    );
  };

  const canProceedToPayment = 
    isAddressValid(shippingAddress) && 
    (useSameAddress || isAddressValid(billingAddress));

  const handleIyzicoPayment = async () => {
    // Adres doğrulaması
    if (!isAddressValid(shippingAddress)) {
      toast.error("Lütfen geçerli bir teslimat adresi seçin veya ekleyin");
      return;
    }

    if (!useSameAddress && !isAddressValid(billingAddress)) {
      toast.error("Lütfen geçerli bir fatura adresi seçin veya ekleyin");
      return;
    }

    setProcessing(true);
    
    try {
      // Ödeme işlemi simülasyonu
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Başarılı ödeme (şimdilik %100 başarılı)
      const paymentSuccess = true; // Her zaman başarılı
      
      if (paymentSuccess) {
        // Sipariş oluştur
        const orderId = await createOrder();
        
        // Sepeti temizle
        await clearCart();
        
        toast.success(`Ödemeniz başarıyla tamamlandı! Sipariş No: ${orderId}`);
        navigate("/", { replace: true });
      } else {
        toast.error("Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.");
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : "Ödeme işlemi sırasında bir hata oluştu");
    } finally {
      setProcessing(false);
    }
  };

  if (!user || items.length === 0) {
    return null; // useEffect will handle redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Ödeme</h1>
            <p className="text-muted-foreground">
              Güvenli ödeme işleminizi tamamlayın
            </p>
          </div>

          <div className="space-y-6">
            {/* Teslimat Adresi */}
            <AddressSelector
              selectedAddressId={shippingAddress?.id || null}
              onAddressSelect={(address) => setShippingAddress(address as CheckoutAddress | null)}
              addressType="shipping"
            />

            {/* Fatura Adresi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Fatura Adresi</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="same-address"
                      checked={useSameAddress}
                      onCheckedChange={setUseSameAddress}
                    />
                    <Label htmlFor="same-address">
                      Teslimat adresi ile aynı
                    </Label>
                  </div>

                  {!useSameAddress && (
                    <AddressSelector
                      selectedAddressId={billingAddress?.id || null}
                      onAddressSelect={(address) => setBillingAddress(address as CheckoutAddress | null)}
                      addressType="billing"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sipariş Özeti */}
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => {
                    const originalPrice = item.products?.base_price || item.product_variants?.price || 0;
                    const currency = item.products?.currency || 'TRY';
                    const tryPrice = calculateTryPrice(originalPrice, currency);
                    
                    return (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.products?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Adet: {item.quantity}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {originalPrice.toFixed(2)} {currency} × {item.quantity}
                            {currency !== 'TRY' && ` (≈ ${tryPrice.toFixed(2)} TL/adet)`}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {(tryPrice * item.quantity).toFixed(2)} TL
                        </p>
                      </div>
                    );
                  })}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Toplam</span>
                    <span>{totalPrice.toFixed(2)} TL</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ödeme Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Ödeme Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lock className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        Güvenli Ödeme
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Iyzico ile güvenli ödeme altyapısı kullanılmaktadır. 
                      Kart bilgileriniz güvenli bir şekilde şifrelenir.
                    </p>
                  </div>

                  <div className="text-center space-y-4">
                    <div className="flex justify-center items-center space-x-4">
                      <img 
                        src="https://www.iyzico.com/assets/images/logo/iyzico-logo.svg"
                        alt="Iyzico"
                        className="h-8"
                      />
                      <div className="text-sm text-muted-foreground">
                        Güvenli Ödeme Altyapısı
                      </div>
                    </div>

                    <Button
                      onClick={handleIyzicoPayment}
                      disabled={processing || !canProceedToPayment}
                      className="w-full"
                      size="lg"
                    >
                      {processing ? (
                        "Ödeme İşleniyor..."
                      ) : !isAddressValid(shippingAddress) ? (
                        "Teslimat Adresi Gerekli"
                      ) : !useSameAddress && !isAddressValid(billingAddress) ? (
                        "Fatura Adresi Gerekli"
                      ) : (
                        `${totalPrice.toFixed(2)} TL Ödeme Yap`
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                      Ödeme yaparak 
                      <span className="underline cursor-pointer"> kullanım koşullarını </span>
                      ve 
                      <span className="underline cursor-pointer"> gizlilik politikasını </span>
                      kabul etmiş olursunuz.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Geri Dön */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => navigate("/cart")}
                disabled={processing}
              >
                Sepete Geri Dön
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;