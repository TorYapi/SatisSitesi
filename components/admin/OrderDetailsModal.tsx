import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Package, User, CreditCard, Calendar, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface OrderDetailsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  created_at: string;
  shipping_address: any;
  billing_address: any;
  notes?: string;
  customers: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products: {
      id: string;
      name: string;
      description?: string;
      product_images?: {
        image_url: string;
        alt_text?: string;
        is_primary: boolean;
      }[];
    };
    product_variants: {
      sku: string;
      colors?: {
        name: string;
        hex_code: string;
      };
      sizes?: {
        name: string;
        display_name: string;
      };
    };
  }[];
}

export const OrderDetailsModal = ({ orderId, isOpen, onClose }: OrderDetailsModalProps) => {
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderId && isOpen) {
      fetchOrderDetails();
    }
  }, [orderId, isOpen]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers:customer_id(first_name, last_name, email, phone),
          order_items(
            id,
            quantity,
            unit_price,
            total_price,
            products:product_id(
              id,
              name,
              description
            ),
            product_variants:variant_id(
              sku,
              colors:color_id(name, hex_code),
              sizes:size_id(name, display_name)
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      // Ayrı sorgu ile product images'ları getir
      if (data && data.order_items) {
        const productIds = data.order_items.map((item: any) => item.products.id);
        const { data: imagesData } = await supabase
          .from('product_images')
          .select('product_id, image_url, alt_text, is_primary')
          .in('product_id', productIds);

        // Images'ları products'a ekle
        data.order_items.forEach((item: any) => {
          item.products.product_images = imagesData?.filter(
            (img: any) => img.product_id === item.products.id
          ) || [];
        });
      }
      
      setOrderDetail(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error("Sipariş detayları yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'confirmed': return 'Onaylandı';
      case 'shipped': return 'Kargoda';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'shipped': return 'outline';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Adres bilgisi bulunamadı';
    
    return (
      <div className="space-y-1 text-sm">
        <p className="font-medium">{address.first_name} {address.last_name}</p>
        {address.phone && <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {address.phone}</p>}
        <p>{address.address_line_1}</p>
        {address.address_line_2 && <p>{address.address_line_2}</p>}
        <p>{address.city} {address.postal_code}</p>
        <p>{address.country || 'Turkey'}</p>
      </div>
    );
  };

  const getPrimaryImage = (images: any[] | undefined) => {
    if (!images || images.length === 0) return '/placeholder.svg';
    const primaryImage = images.find(img => img.is_primary) || images[0];
    return primaryImage.image_url;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Sipariş Detayları
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        ) : orderDetail ? (
          <div className="space-y-6">
            {/* Sipariş Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sipariş #{orderDetail.order_number}</span>
                  <Badge variant={getStatusBadgeVariant(orderDetail.status)}>
                    {getStatusText(orderDetail.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sipariş Tarihi</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(orderDetail.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ödeme Durumu</p>
                    <Badge variant="outline" className="text-xs">
                      {orderDetail.payment_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Toplam Tutar</p>
                    <p className="font-bold text-lg">₺{orderDetail.total_amount.toLocaleString('tr-TR')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ürün Sayısı</p>
                    <p className="font-medium">{orderDetail.order_items.reduce((sum, item) => sum + item.quantity, 0)} adet</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Müşteri Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Müşteri Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-base">
                    {orderDetail.customers.first_name} {orderDetail.customers.last_name}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {orderDetail.customers.email}
                  </p>
                  {orderDetail.customers.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {orderDetail.customers.phone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Adres Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Teslimat Adresi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formatAddress(orderDetail.shipping_address)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Fatura Adresi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formatAddress(orderDetail.billing_address)}
                </CardContent>
              </Card>
            </div>

            {/* Sipariş Kalemleri */}
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Kalemleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderDetail.order_items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <img
                          src={getPrimaryImage(item.products.product_images)}
                          alt={item.products.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium">{item.products.name}</h4>
                        {item.products.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.products.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">SKU: {item.product_variants.sku}</Badge>
                          {item.product_variants.colors && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <div 
                                className="w-3 h-3 rounded-full border" 
                                style={{ backgroundColor: item.product_variants.colors.hex_code }}
                              />
                              {item.product_variants.colors.name}
                            </Badge>
                          )}
                          {item.product_variants.sizes && (
                            <Badge variant="outline">
                              Beden: {item.product_variants.sizes.display_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm text-muted-foreground">Adet: {item.quantity}</p>
                        <p className="text-sm">₺{item.unit_price.toLocaleString('tr-TR')} / adet</p>
                        <p className="font-medium">₺{item.total_price.toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />
                
                {/* Tutar Özeti */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Ara Toplam:</span>
                    <span>₺{orderDetail.subtotal.toLocaleString('tr-TR')}</span>
                  </div>
                  {orderDetail.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Vergi:</span>
                      <span>₺{orderDetail.tax_amount.toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                  {orderDetail.shipping_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Kargo:</span>
                      <span>₺{orderDetail.shipping_amount.toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                  {orderDetail.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>İndirim:</span>
                      <span>-₺{orderDetail.discount_amount.toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Toplam:</span>
                    <span>₺{orderDetail.total_amount.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notlar */}
            {orderDetail.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Sipariş Notları</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{orderDetail.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Sipariş detayları yüklenemedi.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};