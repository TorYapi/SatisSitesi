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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Megaphone,
  Calendar,
  Target,
  Percent
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string;
  campaign_type: string;
  code: string;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  background_color: string;
  text_color: string;
  button_text: string;
  button_link: string;
  image_url: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const CampaignsAdmin = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "expired">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    campaign_type: "percentage",
    code: "",
    discount_value: "",
    min_order_amount: "",
    max_discount_amount: "",
    start_date: "",
    end_date: "",
    usage_limit: "",
    background_color: "#f8f9fa",
    text_color: "#000000",
    button_text: "Kampanyayı Gör",
    button_link: "",
    image_url: "",
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [campaignsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
      ]);

      if (campaignsResponse.error) throw campaignsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      setCampaigns(campaignsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCampaignCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8) + 
      Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const handleNameChange = (name: string) => {
    setCampaignForm(prev => ({
      ...prev,
      name,
      code: generateCampaignCode(name)
    }));
  };

  const openCreateDialog = () => {
    setCampaignForm({
      name: "",
      description: "",
      campaign_type: "percentage",
      code: "",
      discount_value: "",
      min_order_amount: "",
      max_discount_amount: "",
      start_date: "",
      end_date: "",
      usage_limit: "",
      background_color: "#f8f9fa",
      text_color: "#000000",
      button_text: "Kampanyayı Gör",
      button_link: "",
      image_url: "",
      is_active: true
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      description: campaign.description || "",
      campaign_type: campaign.campaign_type,
      code: campaign.code || "",
      discount_value: campaign.discount_value?.toString() || "",
      min_order_amount: campaign.min_order_amount?.toString() || "",
      max_discount_amount: campaign.max_discount_amount?.toString() || "",
      start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().split('T')[0] : "",
      end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : "",
      usage_limit: campaign.usage_limit?.toString() || "",
      background_color: campaign.background_color || "#f8f9fa",
      text_color: campaign.text_color || "#000000",
      button_text: campaign.button_text || "Kampanyayı Gör",
      button_link: campaign.button_link || "",
      image_url: campaign.image_url || "",
      is_active: campaign.is_active
    });
    setIsEditDialogOpen(true);
  };

  const saveCampaign = async () => {
    try {
      // Validate required fields
      if (!campaignForm.name.trim()) {
        toast({
          title: "Hata",
          description: "Kampanya adı zorunludur.",
          variant: "destructive",
        });
        return;
      }

      if (!campaignForm.start_date || !campaignForm.end_date) {
        toast({
          title: "Hata",
          description: "Başlangıç ve bitiş tarihleri zorunludur.",
          variant: "destructive",
        });
        return;
      }

      const campaignData = {
        name: campaignForm.name,
        description: campaignForm.description || null,
        campaign_type: campaignForm.campaign_type as any,
        code: campaignForm.code,
        discount_value: parseFloat(campaignForm.discount_value) || null,
        min_order_amount: parseFloat(campaignForm.min_order_amount) || null,
        max_discount_amount: parseFloat(campaignForm.max_discount_amount) || null,
        start_date: campaignForm.start_date,
        end_date: campaignForm.end_date,
        usage_limit: parseInt(campaignForm.usage_limit) || null,
        usage_count: 0,
        background_color: campaignForm.background_color,
        text_color: campaignForm.text_color,
        button_text: campaignForm.button_text,
        button_link: campaignForm.button_link || null,
        image_url: campaignForm.image_url || null,
        is_active: campaignForm.is_active
      };

      if (selectedCampaign) {
        // Update existing campaign
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', selectedCampaign.id);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Kampanya başarıyla güncellendi.",
        });
      } else {
        // Create new campaign
        const { error } = await supabase
          .from('campaigns')
          .insert([campaignData]);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Kampanya başarıyla oluşturuldu.",
        });
      }

      await fetchData();
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedCampaign(null);
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Hata",
        description: "Kampanya kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const toggleCampaignStatus = async (campaignId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ is_active: !currentStatus })
        .eq('id', campaignId);

      if (error) throw error;

      await fetchData();
      toast({
        title: "Başarılı",
        description: `Kampanya ${!currentStatus ? 'aktif' : 'pasif'} duruma getirildi.`,
      });
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast({
        title: "Hata",
        description: "Kampanya durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      await fetchData();
      toast({
        title: "Başarılı",
        description: "Kampanya başarıyla silindi.",
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Hata",
        description: "Kampanya silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const isExpired = (endDate: string) => {
    return endDate && new Date(endDate) < new Date();
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (campaign.code && campaign.code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filter === "all" || 
      (filter === "active" && campaign.is_active && !isExpired(campaign.end_date)) ||
      (filter === "inactive" && !campaign.is_active) ||
      (filter === "expired" && isExpired(campaign.end_date));

    return matchesSearch && matchesFilter;
  });

  const getCampaignTypeText = (type: string) => {
    switch (type) {
      case 'percentage': return 'Yüzde İndirim';
      case 'fixed_amount': return 'Sabit Tutar İndirim';
      case 'buy_x_get_y': return 'Al X Öde Y';
      case 'free_shipping': return 'Ücretsiz Kargo';
      case 'hero': return 'Ana Sayfa Kampanyası';
      default: return type;
    }
  };

  const getUsagePercentage = (campaign: Campaign) => {
    if (!campaign.usage_limit) return 0;
    return Math.round((campaign.usage_count / campaign.usage_limit) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Kampanya Yönetimi</h1>
            <p className="text-muted-foreground">Kampanyaları yönetin ve düzenleyin</p>
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
          <h1 className="text-3xl font-bold">Kampanya Yönetimi</h1>
          <p className="text-muted-foreground">
            Toplam {campaigns.length} kampanya, {filteredCampaigns.length} gösteriliyor
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kampanya
        </Button>
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
                  placeholder="Kampanya ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { key: "all", label: "Tümü" },
                { key: "active", label: "Aktif" },
                { key: "inactive", label: "Pasif" },
                { key: "expired", label: "Süresi Dolmuş" },
              ].map((filterOption) => (
                <Button
                  key={filterOption.key}
                  variant={filter === filterOption.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filterOption.key as any)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {filterOption.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kampanya</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>İndirim</TableHead>
              <TableHead>Kullanım</TableHead>
              <TableHead>Tarih Aralığı</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center"
                         style={{ backgroundColor: campaign.background_color }}>
                      {campaign.image_url ? (
                        <img
                          src={campaign.image_url}
                          alt={campaign.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Megaphone className="h-4 w-4" style={{ color: campaign.text_color }} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {campaign.code && `Kod: ${campaign.code}`}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getCampaignTypeText(campaign.campaign_type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {campaign.discount_value}%
                    </span>
                  </div>
                  {campaign.min_order_amount && (
                    <div className="text-xs text-muted-foreground">
                      Min: ₺{campaign.min_order_amount}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{campaign.usage_count}</span>
                      <span>{campaign.usage_limit || '∞'}</span>
                    </div>
                    {campaign.usage_limit && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${getUsagePercentage(campaign)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('tr-TR') : '-'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('tr-TR') : '-'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Badge 
                      variant={campaign.is_active && !isExpired(campaign.end_date) ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleCampaignStatus(campaign.id, campaign.is_active)}
                    >
                      {campaign.is_active ? 
                        (isExpired(campaign.end_date) ? "Süresi Dolmuş" : "Aktif") : 
                        "Pasif"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditDialog(campaign)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteCampaign(campaign.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredCampaigns.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || filter !== "all" 
              ? "Arama kriterlerinize uygun kampanya bulunamadı." 
              : "Henüz kampanya eklenmemiş."}
          </div>
        )}
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Kampanya Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir kampanya oluşturun ve ayarlarını yapılandırın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Temel Bilgiler</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Kampanya Adı *</Label>
                  <Input
                    id="campaignName"
                    value={campaignForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Kampanya adı"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaignCode">Kampanya Kodu</Label>
                  <Input
                    id="campaignCode"
                    value={campaignForm.code}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="KAMPANYA2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaignType">Kampanya Türü</Label>
                  <Select
                    value={campaignForm.campaign_type}
                    onValueChange={(value) => setCampaignForm(prev => ({ ...prev, campaign_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde İndirim</SelectItem>
                      <SelectItem value="fixed_amount">Sabit Tutar İndirim</SelectItem>
                      <SelectItem value="buy_x_get_y">Al X Öde Y</SelectItem>
                      <SelectItem value="free_shipping">Ücretsiz Kargo</SelectItem>
                      <SelectItem value="hero">Ana Sayfa Kampanyası</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">İndirim Oranı (%)</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={campaignForm.discount_value}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, discount_value: e.target.value }))}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minAmount">Minimum Sipariş Tutarı</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    value={campaignForm.min_order_amount}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, min_order_amount: e.target.value }))}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">Maksimum İndirim Tutarı</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    value={campaignForm.max_discount_amount}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, max_discount_amount: e.target.value }))}
                    placeholder="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={campaignForm.start_date}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Bitiş Tarihi</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={campaignForm.end_date}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Kullanım Limiti</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={campaignForm.usage_limit}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, usage_limit: e.target.value }))}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kampanya açıklaması"
                  rows={3}
                />
              </div>
            </div>

            {/* Visual Settings */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Görsel Ayarlar</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Arka Plan Rengi</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={campaignForm.background_color}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={campaignForm.background_color}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, background_color: e.target.value }))}
                      placeholder="#f8f9fa"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">Yazı Rengi</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={campaignForm.text_color}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={campaignForm.text_color}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, text_color: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buttonText">Buton Yazısı</Label>
                  <Input
                    id="buttonText"
                    value={campaignForm.button_text}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, button_text: e.target.value }))}
                    placeholder="Kampanyayı Gör"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buttonLink">Buton Linki</Label>
                  <Input
                    id="buttonLink"
                    value={campaignForm.button_link}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, button_link: e.target.value }))}
                    placeholder="https://example.com/kampanya"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Resim URL</Label>
                  <Input
                    id="imageUrl"
                    value={campaignForm.image_url}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                İptal
              </Button>
              <Button 
                onClick={saveCampaign}
                disabled={!campaignForm.name}
              >
                Kampanya Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kampanya Düzenle</DialogTitle>
            <DialogDescription>
              {selectedCampaign?.name} kampanyasını düzenleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Same form content as create dialog */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Temel Bilgiler</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCampaignName">Kampanya Adı *</Label>
                  <Input
                    id="editCampaignName"
                    value={campaignForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Kampanya adı"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editCampaignCode">Kampanya Kodu</Label>
                  <Input
                    id="editCampaignCode"
                    value={campaignForm.code}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="KAMPANYA2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editCampaignType">Kampanya Türü</Label>
                  <Select
                    value={campaignForm.campaign_type}
                    onValueChange={(value) => setCampaignForm(prev => ({ ...prev, campaign_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde İndirim</SelectItem>
                      <SelectItem value="fixed_amount">Sabit Tutar İndirim</SelectItem>
                      <SelectItem value="buy_x_get_y">Al X Öde Y</SelectItem>
                      <SelectItem value="free_shipping">Ücretsiz Kargo</SelectItem>
                      <SelectItem value="hero">Ana Sayfa Kampanyası</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editDiscountValue">İndirim Oranı (%)</Label>
                  <Input
                    id="editDiscountValue"
                    type="number"
                    value={campaignForm.discount_value}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, discount_value: e.target.value }))}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Başlangıç Tarihi</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={campaignForm.start_date}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editEndDate">Bitiş Tarihi</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={campaignForm.end_date}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={saveCampaign}>
                Güncelle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignsAdmin;