import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Eye,
  Star,
  DollarSign,
  Calendar
} from "lucide-react";

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  pendingOrders: number;
  averageRating: number;
  monthlyOrders: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    pendingOrders: 0,
    averageRating: 0,
    monthlyOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch products stats
      const { data: productsData } = await supabase
        .from('products')
        .select('id, is_active');

      // Fetch users stats
      const { data: usersData } = await supabase
        .from('customers')
        .select('id');

      // Fetch orders stats
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, status, total_amount, created_at');

      // Fetch reviews for average rating
      const { data: reviewsData } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('is_approved', true);

      const totalProducts = productsData?.length || 0;
      const activeProducts = productsData?.filter(p => p.is_active).length || 0;
      const totalUsers = usersData?.length || 0;
      const totalOrders = ordersData?.length || 0;
      const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
      
      // Calculate monthly orders (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyOrders = ordersData?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }).length || 0;

      // Calculate average rating
      const averageRating = reviewsData?.length > 0 
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length 
        : 0;

      setStats({
        totalProducts,
        activeProducts,
        totalUsers,
        totalOrders,
        pendingOrders,
        totalRevenue,
        averageRating,
        monthlyOrders,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Toplam Ürün",
      value: stats.totalProducts,
      description: `${stats.activeProducts} aktif ürün`,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Toplam Kullanıcı",
      value: stats.totalUsers,
      description: "Kayıtlı müşteri",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Toplam Sipariş",
      value: stats.totalOrders,
      description: `${stats.pendingOrders} beklemede`,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Toplam Gelir",
      value: `₺${stats.totalRevenue.toLocaleString('tr-TR')}`,
      description: "Tüm zamanlar",
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Bu Ay Sipariş",
      value: stats.monthlyOrders,
      description: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Ortalama Puan",
      value: stats.averageRating.toFixed(1),
      description: "5 üzerinden",
      icon: Star,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Admin panel ana sayfa</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 w-8 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">E-ticaret sistemi genel görünümü</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Hızlı İşlemler
            </CardTitle>
            <CardDescription>Sık kullanılan admin işlemleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate('/admin/products')}
            >
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Yeni Ürün Ekle</span>
              </div>
              <Badge>Ürünler</Badge>
            </div>
            <div 
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate('/admin/orders')}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Siparişleri Görüntüle</span>
              </div>
              <Badge variant="secondary">{stats.pendingOrders} Beklemede</Badge>
            </div>
            <div 
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate('/admin/discounts')}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-green-600" />
                <span className="font-medium">İndirim Yönetimi</span>
              </div>
              <Badge variant="outline">Kampanyalar</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Sistem Durumu
            </CardTitle>
            <CardDescription>Genel sistem sağlığı</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aktif Ürünler</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">{stats.activeProducts}/{stats.totalProducts}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Bekleyen Siparişler</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stats.pendingOrders > 0 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <span className="text-sm">{stats.pendingOrders}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ortalama Değerlendirme</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">{stats.averageRating.toFixed(1)}/5</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Bu Ay Gelir</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">₺{stats.totalRevenue.toLocaleString('tr-TR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;