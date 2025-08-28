import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { adminSecurity, type CustomerData } from "@/lib/adminSecurity";
import AuditLogViewer from "@/components/admin/AuditLogViewer";
import { 
  Users, 
  MessageSquare, 
  Star,
  Reply,
  Check,
  X,
  Search,
  Filter,
  Calendar,
  Mail,
  UserCheck,
  TrendingUp,
  Shield,
  AlertTriangle
} from "lucide-react";

// Using CustomerData type from adminSecurity

interface ProductReview {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title?: string;
  comment?: string;
  is_approved: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  admin_response?: string;
  admin_response_date?: string;
  customers?: Pick<CustomerData, 'id' | 'first_name' | 'last_name' | 'email'> | null;
  products?: {
    name: string;
    slug: string;
  } | null;
}

const UsersAdmin = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewFilter, setReviewFilter] = useState<"all" | "pending" | "approved" | "responded">("all");
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
    fetchReviews();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setSecurityAlert(null);
      
      // Use secure admin service with audit logging
      const data = await adminSecurity.getCustomers(100, 0);
      setCustomers(data);
      
      // Log this admin action
      await adminSecurity.logAdminAction('ADMIN_DASHBOARD_ACCESS', {
        action: 'view_customer_list',
        customer_count: data.length
      });
      
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      
      if (error.message?.includes('Rate limit exceeded')) {
        setSecurityAlert('Güvenlik: Çok fazla istek yapıldı. Lütfen biraz bekleyin.');
      } else if (error.message?.includes('Access denied')) {
        setSecurityAlert('Güvenlik: Bu işlem için yetkiniz bulunmuyor.');
      }
      
      toast({
        title: "Hata",
        description: error.message || "Müşteriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          products:product_id(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer data with security controls
      const reviewsWithCustomers = await Promise.all(
        (data || []).map(async (review) => {
          const customerData = await adminSecurity.getCustomerForReview(review.user_id);
          
          return {
            ...review,
            customers: customerData
          };
        })
      );

      setReviews(reviewsWithCustomers);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Hata",
        description: "Yorumlar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const toggleReviewApproval = async (reviewId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: !currentStatus })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { ...review, is_approved: !currentStatus }
          : review
      ));

      toast({
        title: "Başarılı",
        description: `Yorum ${!currentStatus ? 'onaylandı' : 'onayı kaldırıldı'}.`,
      });
    } catch (error) {
      console.error('Error updating review approval:', error);
      toast({
        title: "Hata",
        description: "Yorum durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const openResponseDialog = (review: ProductReview) => {
    setSelectedReview(review);
    setResponseText(review.admin_response || "");
    setIsResponseDialogOpen(true);
  };

  const submitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ 
          admin_response: responseText.trim(),
          admin_response_date: new Date().toISOString()
        })
        .eq('id', selectedReview.id);

      if (error) throw error;

      setReviews(reviews.map(review => 
        review.id === selectedReview.id 
          ? { 
              ...review, 
              admin_response: responseText.trim(),
              admin_response_date: new Date().toISOString()
            }
          : review
      ));

      setIsResponseDialogOpen(false);
      setSelectedReview(null);
      setResponseText("");

      toast({
        title: "Başarılı",
        description: "Yanıt başarıyla kaydedildi.",
      });
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Hata",
        description: "Yanıt gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customers?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customers?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.products?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      reviewFilter === "all" || 
      (reviewFilter === "pending" && !review.is_approved) ||
      (reviewFilter === "approved" && review.is_approved) ||
      (reviewFilter === "responded" && review.admin_response);

    return matchesSearch && matchesFilter;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading && reviewsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
            <p className="text-muted-foreground">Müşteriler ve yorumları yönetin</p>
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
          <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">
            Müşteriler ve yorumları yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-muted-foreground">Güvenlik Aktif</span>
        </div>
      </div>

      {/* Security Alert */}
      {securityAlert && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <p className="text-sm text-orange-800">{securityAlert}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Müşteri İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              Kayıtlı müşteri sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay Katılanlar</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(customer => {
                if (!customer.created_at) return false;
                const customerDate = new Date(customer.created_at);
                const currentDate = new Date();
                const currentMonth = currentDate.getMonth();
                const currentYear = currentDate.getFullYear();
                return customerDate.getMonth() === currentMonth && customerDate.getFullYear() === currentYear;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Bu ay kaydolan müşteri
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Yorumcular</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(reviews.map(review => review.user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Yorum yapan müşteri sayısı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Müşteri E-posta Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Müşteri E-posta Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <span>Son kayıt olanlar önce gösteriliyor</span>
              <span>{customers.length} müşteri</span>
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <div className="divide-y">
                {customers.slice(0, 50).map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {(customer.first_name || 'U').charAt(0)}{(customer.last_name || '').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customer.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString('tr-TR') : '-'}
                    </div>
                  </div>
                ))}
                {customers.length > 50 && (
                  <div className="p-3 text-center text-sm text-muted-foreground border-t">
                    ve {customers.length - 50} müşteri daha...
                  </div>
                )}
              </div>
            </div>
            {customers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Henüz kayıtlı müşteri bulunmuyor.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="reviews" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Müşteri Yorumları ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Müşteriler ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Güvenlik Denetimi
          </TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          {/* Reviews Filters */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Yorum Filtreleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Yorum, müşteri veya ürün ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {[
                    { key: "all", label: "Tümü" },
                    { key: "pending", label: "Bekleyen" },
                    { key: "approved", label: "Onaylı" },
                    { key: "responded", label: "Yanıtlanan" },
                  ].map((filterOption) => (
                    <Button
                      key={filterOption.key}
                      variant={reviewFilter === filterOption.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReviewFilter(filterOption.key as any)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {filterOption.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Değerlendirme</TableHead>
                  <TableHead>Yorum</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {review.customers?.first_name} {review.customers?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {review.customers?.email}
                        </div>
                        {review.is_verified_purchase && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Doğrulanmış Alım
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{review.products?.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm font-medium">{review.rating}/5</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {review.title && (
                          <div className="font-medium text-sm mb-1">{review.title}</div>
                        )}
                        {review.comment && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {review.comment}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge 
                          variant={review.is_approved ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleReviewApproval(review.id, review.is_approved)}
                        >
                          {review.is_approved ? "Onaylı" : "Bekliyor"}
                        </Badge>
                        {review.admin_response && (
                          <Badge variant="outline" className="text-xs">
                            Yanıtlandı
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(review.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openResponseDialog(review)}
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleReviewApproval(review.id, review.is_approved)}
                          className={review.is_approved ? "text-orange-600" : "text-green-600"}
                        >
                          {review.is_approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredReviews.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || reviewFilter !== "all" 
                  ? "Arama kriterlerinize uygun yorum bulunamadı." 
                  : "Henüz yorum bulunmuyor."}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </div>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString('tr-TR') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {customers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Henüz kayıtlı müşteri bulunmuyor.
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yoruma Yanıt Ver</DialogTitle>
            <DialogDescription>
              Müşteri yorumuna yanıt verin
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-sm font-medium">{selectedReview.rating}/5</span>
                </div>
                {selectedReview.title && (
                  <div className="font-medium mb-1">{selectedReview.title}</div>
                )}
                {selectedReview.comment && (
                  <div className="text-sm text-muted-foreground">{selectedReview.comment}</div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {selectedReview.customers?.first_name} {selectedReview.customers?.last_name} - {selectedReview.products?.name}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="response">Yanıtınız</Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Müşteriye yanıtınızı yazın..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={submitResponse} disabled={!responseText.trim()}>
                  Yanıt Gönder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersAdmin;