import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Calendar, MapPin, CreditCard, Truck } from "lucide-react";
import { formatDate } from "date-fns";
import { tr } from "date-fns/locale";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  delivery_status: string | null;
  total_amount: number;
  created_at: string;
  delivered_at: string | null;
  tracking_number: string | null;
  shipping_address: any;
  order_items: {
    quantity: number;
    unit_price: number;
    total_price: number;
    product: {
      name: string;
      slug: string;
    };
    variant: {
      sku: string;
    };
  }[];
}

const Orders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Get customer id first
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (customerError || !customerData) {
        console.error('Customer not found:', customerError);
        return;
      }

      // Get orders with related data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          delivery_status,
          total_amount,
          created_at,
          delivered_at,
          tracking_number,
          shipping_address,
          order_items!inner(
            quantity,
            unit_price,
            total_price,
            product:products!inner(
              name,
              slug
            ),
            variant:product_variants!inner(
              sku
            )
          )
        `)
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Hata",
        description: "Siparişleriniz yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Beklemede",
      confirmed: "Onaylandı",
      processing: "İşleniyor", 
      shipped: "Kargoda",
      delivered: "Teslim Edildi",
      cancelled: "İptal Edildi",
      refunded: "İade Edildi"
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Ödeme Bekliyor",
      completed: "Ödeme Tamamlandı",
      failed: "Ödeme Başarısız",
      refunded: "İade Edildi"
    };
    return statusMap[status] || status;
  };

  const getDeliveryStatusText = (status: string | null) => {
    if (!status) return null;
    const statusMap: Record<string, string> = {
      preparing: "Hazırlanıyor",
      shipped: "Kargoda",
      in_transit: "Yolda",
      delivered: "Teslim Edildi"
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'shipped':
      case 'confirmed':
        return 'secondary';
      case 'processing':
        return 'outline';
      case 'cancelled':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Siparişlerim</h1>
            <p className="text-muted-foreground">
              Siparişlerinizi görüntülemek için giriş yapmanız gerekiyor.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Siparişlerim</h1>
            <p className="text-muted-foreground">
              Vermiş olduğunuz siparişlerin durumunu buradan takip edebilirsiniz.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Siparişleriniz yükleniyor...</p>
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Henüz sipariş vermediniz</h3>
                <p className="text-muted-foreground">
                  İlk siparişinizi vermek için ürünlerimize göz atın.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">
                          Sipariş #{order.order_number}
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(new Date(order.created_at), "dd MMMM yyyy", { locale: tr })}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(order.payment_status)}>
                          <CreditCard className="w-3 h-3 mr-1" />
                          {getPaymentStatusText(order.payment_status)}
                        </Badge>
                        {order.delivery_status && (
                          <Badge variant="outline">
                            <Truck className="w-3 h-3 mr-1" />
                            {getDeliveryStatusText(order.delivery_status)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Sipariş İçeriği</h4>
                      {order.order_items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {item.product.name} ({item.variant.sku}) x{item.quantity}
                          </span>
                          <span className="font-medium">
                            ₺{item.total_price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Order Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Teslimat Adresi
                        </h4>
                        <div className="text-muted-foreground">
                          {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                          <br />
                          {order.shipping_address?.address_line_1}
                          {order.shipping_address?.address_line_2 && (
                            <>
                              <br />
                              {order.shipping_address.address_line_2}
                            </>
                          )}
                          <br />
                          {order.shipping_address?.city}, {order.shipping_address?.postal_code}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Toplam Tutar:</span>
                          <span className="text-lg font-bold text-primary">
                            ₺{order.total_amount.toFixed(2)}
                          </span>
                        </div>
                        
                        {order.tracking_number && (
                          <div className="mt-2">
                            <span className="font-medium">Kargo Takip No:</span>
                            <br />
                            <span className="text-muted-foreground font-mono">
                              {order.tracking_number}
                            </span>
                          </div>
                        )}
                        
                        {order.delivered_at && (
                          <div className="mt-2">
                            <span className="font-medium">Teslim Tarihi:</span>
                            <br />
                            <span className="text-muted-foreground">
                              {formatDate(new Date(order.delivered_at), "dd MMMM yyyy HH:mm", { locale: tr })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Orders;