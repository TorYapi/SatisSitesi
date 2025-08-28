import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OrderDetailsModal } from "@/components/admin/OrderDetailsModal";
import { adminSecurity } from "@/lib/adminSecurity";
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
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ShoppingCart,
  Eye,
  Filter,
  Package,
  MapPin,
  Check,
  X,
  Truck
} from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  order_items: {
    quantity: number;
    unit_price: number;
    products: {
      name: string;
    };
  }[];
  shipping_address: any;
}

const OrdersAdmin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch orders with audit logging for admin access
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers:customer_id(first_name, last_name, email),
          order_items(
            quantity,
            unit_price,
            products:product_id(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Log admin access to customer order data
      if (data && data.length > 0) {
        await adminSecurity.logAdminAction('VIEW_ORDERS', {
          order_count: data.length,
          accessed_at: new Date().toISOString()
        });
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Hata",
        description: "Siparişler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus as any })
        .eq('id', orderId);

      if (error) throw error;

      // Log admin action for order status update
      await adminSecurity.logAdminAction('UPDATE_ORDER_STATUS', {
        order_id: orderId,
        old_status: orders.find(o => o.id === orderId)?.status,
        new_status: newStatus,
        updated_at: new Date().toISOString()
      });

      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));

      const statusMessages = {
        'confirmed': 'Sipariş onaylandı',
        'cancelled': 'Sipariş iptal edildi', 
        'shipped': 'Sipariş kargoya verildi',
        'delivered': 'Sipariş teslim edildi'
      };

      toast({
        title: "Başarılı",
        description: statusMessages[newStatus as keyof typeof statusMessages] || "Sipariş durumu güncellendi.",
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Hata",
        description: "Sipariş durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const confirmOrder = async (orderId: string) => {
    if (!confirm('Bu siparişi onaylamak istediğinizden emin misiniz?')) return;
    await updateOrderStatus(orderId, 'confirmed');
  };

  const openOrderDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDetailsModalOpen(true);
  };

  const closeOrderDetails = () => {
    setSelectedOrderId(null);
    setIsDetailsModalOpen(false);
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Bu siparişi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;
    await updateOrderStatus(orderId, 'cancelled');
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

  const getTotalItems = (orderItems: Order['order_items']) => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customers?.first_name} ${order.customers?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sipariş Yönetimi</h1>
            <p className="text-muted-foreground">Siparişleri yönetin ve takip edin</p>
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
          <h1 className="text-3xl font-bold">Sipariş Yönetimi</h1>
          <p className="text-muted-foreground">
            Toplam {orders.length} sipariş, {filteredOrders.length} gösteriliyor
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Sipariş no, müşteri ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { key: "all", label: "Tümü" },
                { key: "pending", label: "Beklemede" },
                { key: "confirmed", label: "Onaylandı" },
                { key: "shipped", label: "Kargoda" },
                { key: "delivered", label: "Teslim Edildi" },
                { key: "cancelled", label: "İptal" },
              ].map((filterOption) => (
                <Button
                  key={filterOption.key}
                  variant={statusFilter === filterOption.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(filterOption.key)}
                >
                  {filterOption.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sipariş</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Ürünler</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">#{order.order_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {getTotalItems(order.order_items)} ürün
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {order.customers?.first_name} {order.customers?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.customers?.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {order.order_items.slice(0, 2).map((item, index) => (
                      <div key={index} className="text-sm">
                        {item.products.name} × {item.quantity}
                      </div>
                    ))}
                    {order.order_items.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{order.order_items.length - 2} ürün daha
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    ₺{order.total_amount.toLocaleString('tr-TR')}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {order.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                    
                    {/* Onaylama ve Reddetme Butonları - Ödeme durumuna bakılmaksızın gösterilir */}
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <div className="flex gap-1 flex-wrap">
                        {order.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => confirmOrder(order.id)}
                              className="text-xs h-7 px-3 bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Onayla
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelOrder(order.id)}
                              className="text-xs h-7 px-3"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reddet
                            </Button>
                          </>
                        )}
                        
                        {order.status === 'confirmed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                              className="text-xs h-7 px-3 text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              Kargola
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelOrder(order.id)}
                              className="text-xs h-7 px-3"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reddet
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    
                    {order.status === 'shipped' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="text-xs h-7 px-3 text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Teslim Et
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openOrderDetails(order.id)}
                      title="Detayları Görüntüle"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== "all" 
              ? "Arama kriterlerinize uygun sipariş bulunamadı." 
              : "Henüz sipariş verilmemiş."}
          </div>
        )}
      </Card>

      {/* Order Details Modal */}
      <OrderDetailsModal
        orderId={selectedOrderId}
        isOpen={isDetailsModalOpen}
        onClose={closeOrderDetails}
      />
    </div>
  );
};

export default OrdersAdmin;