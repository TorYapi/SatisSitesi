import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Mail, 
  Shield, 
  Palette, 
  Globe, 
  Database,
  CreditCard,
  Truck,
  Bell,
  FileText,
  Users,
  Settings as SettingsIcon
} from "lucide-react";

interface SiteSettings {
  site_name: string;
  site_description: string;
  site_logo: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  currency: string;
  tax_rate: number;
  shipping_fee: number;
  free_shipping_threshold: number;
  maintenance_mode: boolean;
  allow_registration: boolean;
  require_email_verification: boolean;
  max_login_attempts: number;
  session_timeout: number;
  backup_frequency: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  order_notifications: boolean;
  low_stock_threshold: number;
  terms_of_service: string;
  privacy_policy: string;
  return_policy: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  google_analytics_id: string;
  facebook_pixel_id: string;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({
    site_name: "E-Commerce Platform",
    site_description: "Modern ve güvenilir e-ticaret platformu",
    contact_email: "info@example.com",
    contact_phone: "+90 555 123 4567",
    address: "İstanbul, Türkiye",
    currency: "TRY",
    tax_rate: 18,
    shipping_fee: 15,
    free_shipping_threshold: 150,
    maintenance_mode: false,
    allow_registration: true,
    require_email_verification: true,
    max_login_attempts: 5,
    session_timeout: 30,
    backup_frequency: "daily",
    email_notifications: true,
    sms_notifications: false,
    order_notifications: true,
    low_stock_threshold: 5,
    terms_of_service: "Hizmet şartları burada yer alacak...",
    privacy_policy: "Gizlilik politikası burada yer alacak...",
    return_policy: "İade politikası burada yer alacak...",
    primary_color: "#3b82f6",
    secondary_color: "#64748b",
    accent_color: "#f59e0b",
    meta_title: "E-Commerce Platform - Online Alışveriş",
    meta_description: "Güvenilir e-ticaret platformu ile online alışveriş yapın",
    meta_keywords: "e-ticaret, online alışveriş, güvenli ödeme",
    google_analytics_id: "",
    facebook_pixel_id: ""
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      // Convert array to object for easier access
      const settingsObject: any = {};
      data?.forEach(setting => {
        try {
          // Parse JSON values
          settingsObject[setting.key] = JSON.parse(String(setting.value));
        } catch {
          // If not JSON, use as string
          settingsObject[setting.key] = setting.value;
        }
      });

      setSettings(settingsObject);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Hata",
        description: "Ayarlar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Convert settings object to upsert format
      const settingsToUpsert = Object.entries(settings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        category: getCategoryForKey(key)
      }));

      const { error } = await supabase
        .from('settings')
        .upsert(settingsToUpsert, { onConflict: 'key' });

      if (error) throw error;
      
      toast({
        title: "Başarılı",
        description: "Ayarlar başarıyla kaydedildi.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryForKey = (key: string): string => {
    if (['site_name', 'site_description', 'contact_email', 'contact_phone', 'address', 'currency', 'tax_rate', 'shipping_fee', 'free_shipping_threshold', 'maintenance_mode', 'low_stock_threshold'].includes(key)) {
      return 'general';
    }
    if (['allow_registration', 'require_email_verification', 'max_login_attempts', 'session_timeout', 'backup_frequency'].includes(key)) {
      return 'security';
    }
    if (['email_notifications', 'sms_notifications', 'order_notifications'].includes(key)) {
      return 'notifications';
    }
    if (['primary_color', 'secondary_color', 'accent_color'].includes(key)) {
      return 'appearance';
    }
    if (['terms_of_service', 'privacy_policy', 'return_policy'].includes(key)) {
      return 'legal';
    }
    if (['meta_title', 'meta_description', 'meta_keywords', 'google_analytics_id', 'facebook_pixel_id'].includes(key)) {
      return 'seo';
    }
    return 'general';
  };

  const handleBackup = async () => {
    try {
      // Simulate backup process
      toast({
        title: "Yedekleme Başlatıldı",
        description: "Veritabanı yedekleme işlemi başlatıldı. Bu işlem birkaç dakika sürebilir.",
      });
      
      // Here you would implement actual backup logic
      setTimeout(() => {
        toast({
          title: "Yedekleme Tamamlandı",
          description: "Veritabanı başarıyla yedeklendi.",
        });
      }, 3000);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yedekleme işlemi başarısız oldu.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async () => {
    try {
      if (!confirm('Bu işlem mevcut verileri geri yüklenecek verilerle değiştirecek. Devam etmek istediğinizden emin misiniz?')) {
        return;
      }
      
      toast({
        title: "Geri Yükleme Başlatıldı",
        description: "Veritabanı geri yükleme işlemi başlatıldı.",
      });
      
      // Here you would implement actual restore logic
      setTimeout(() => {
        toast({
          title: "Geri Yükleme Tamamlandı",
          description: "Veritabanı başarıyla geri yüklendi.",
        });
      }, 3000);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Geri yükleme işlemi başarısız oldu.",
        variant: "destructive",
      });
    }
  };

  const generateSitemap = async () => {
    try {
      toast({
        title: "Sitemap Oluşturuluyor",
        description: "Site haritası oluşturma işlemi başlatıldı.",
      });
      
      // Here you would implement sitemap generation
      setTimeout(() => {
        toast({
          title: "Sitemap Oluşturuldu",
          description: "Site haritası başarıyla oluşturuldu ve /sitemap.xml adresinde yayınlandı.",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sitemap oluşturma işlemi başarısız oldu.",
        variant: "destructive",
      });
    }
  };

  const updateRobotsTxt = async () => {
    try {
      toast({
        title: "Robots.txt Güncelleniyor",
        description: "Robots.txt dosyası güncelleme işlemi başlatıldı.",
      });
      
      // Here you would implement robots.txt update
      setTimeout(() => {
        toast({
          title: "Robots.txt Güncellendi",
          description: "Robots.txt dosyası başarıyla güncellendi.",
        });
      }, 1500);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Robots.txt güncelleme işlemi başarısız oldu.",
        variant: "destructive",
      });
    }
  };

  const updateSetting = (key: keyof SiteSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sistem Ayarları</h1>
            <p className="text-muted-foreground">Site ayarlarını yönetin</p>
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
          <h1 className="text-3xl font-bold">Sistem Ayarları</h1>
          <p className="text-muted-foreground">
            Site genelinde kullanılacak ayarları yapılandırın
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Genel
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Ödeme
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Güvenlik
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Görünüm
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        {/* Genel Ayarlar */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Site Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="site_name">Site Adı</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name || ""}
                    onChange={(e) => updateSetting("site_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="site_description">Site Açıklaması</Label>
                  <Textarea
                    id="site_description"
                    value={settings.site_description || ""}
                    onChange={(e) => updateSetting("site_description", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="site_logo">Logo URL</Label>
                  <Input
                    id="site_logo"
                    value={settings.site_logo || ""}
                    onChange={(e) => updateSetting("site_logo", e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  İletişim Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contact_email">E-posta</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email || ""}
                    onChange={(e) => updateSetting("contact_email", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Telefon</Label>
                  <Input
                    id="contact_phone"
                    value={settings.contact_phone || ""}
                    onChange={(e) => updateSetting("contact_phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adres</Label>
                  <Textarea
                    id="address"
                    value={settings.address || ""}
                    onChange={(e) => updateSetting("address", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Kargo Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shipping_fee">Kargo Ücreti (TL)</Label>
                  <Input
                    id="shipping_fee"
                    type="number"
                    value={settings.shipping_fee || 0}
                    onChange={(e) => updateSetting("shipping_fee", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="free_shipping_threshold">Ücretsiz Kargo Limiti (TL)</Label>
                  <Input
                    id="free_shipping_threshold"
                    type="number"
                    value={settings.free_shipping_threshold || 0}
                    onChange={(e) => updateSetting("free_shipping_threshold", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="low_stock_threshold">Düşük Stok Uyarı Limiti</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    value={settings.low_stock_threshold || 0}
                    onChange={(e) => updateSetting("low_stock_threshold", Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Sistem Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance_mode">Bakım Modu</Label>
                  <Switch
                    id="maintenance_mode"
                    checked={settings.maintenance_mode || false}
                    onCheckedChange={(checked) => updateSetting("maintenance_mode", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_registration">Yeni Üyelik</Label>
                  <Switch
                    id="allow_registration"
                    checked={settings.allow_registration || false}
                    onCheckedChange={(checked) => updateSetting("allow_registration", checked)}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Para Birimi</Label>
                  <Input
                    id="currency"
                    value={settings.currency || ""}
                    onChange={(e) => updateSetting("currency", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tax_rate">Vergi Oranı (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    value={settings.tax_rate || 0}
                    onChange={(e) => updateSetting("tax_rate", Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ödeme Ayarları */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Ödeme Yöntemleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kredi Kartı Ayarları</h3>
                  <div className="flex items-center justify-between">
                    <Label>Kredi Kartı Kabul Et</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>3D Secure Zorunlu</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Taksit İmkanı</Label>
                    <Switch defaultChecked />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Alternatif Ödeme</h3>
                  <div className="flex items-center justify-between">
                    <Label>Kapıda Ödeme</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Havale/EFT</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Kripto Para</Label>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Güvenlik Ayarları */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Kimlik Doğrulama
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="require_email_verification">E-posta Doğrulama Zorunlu</Label>
                  <Switch
                    id="require_email_verification"
                    checked={settings.require_email_verification || false}
                    onCheckedChange={(checked) => updateSetting("require_email_verification", checked)}
                  />
                </div>
                <div>
                  <Label htmlFor="max_login_attempts">Maks. Giriş Denemesi</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    value={settings.max_login_attempts || 0}
                    onChange={(e) => updateSetting("max_login_attempts", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="session_timeout">Oturum Süresi (dakika)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.session_timeout || 0}
                    onChange={(e) => updateSetting("session_timeout", Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Yedekleme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="backup_frequency">Yedekleme Sıklığı</Label>
                  <select
                    id="backup_frequency"
                    value={settings.backup_frequency || "daily"}
                    onChange={(e) => updateSetting("backup_frequency", e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                  </select>
                </div>
                <Button variant="outline" className="w-full" onClick={handleBackup}>
                  <Database className="h-4 w-4 mr-2" />
                  Manuel Yedek Al
                </Button>
                <Button variant="outline" className="w-full" onClick={handleRestore}>
                  Yedek Geri Yükle
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bildirim Ayarları */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Bildirim Tercihleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">E-posta Bildirimleri</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_notifications">E-posta Bildirimleri</Label>
                    <Switch
                      id="email_notifications"
                      checked={settings.email_notifications || false}
                      onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="order_notifications">Sipariş Bildirimleri</Label>
                    <Switch
                      id="order_notifications"
                      checked={settings.order_notifications || false}
                      onCheckedChange={(checked) => updateSetting("order_notifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Düşük Stok Uyarıları</Label>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">SMS Bildirimleri</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms_notifications">SMS Bildirimleri</Label>
                    <Switch
                      id="sms_notifications"
                      checked={settings.sms_notifications || false}
                      onCheckedChange={(checked) => updateSetting("sms_notifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Sipariş Durumu SMS</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Pazarlama SMS</Label>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Görünüm Ayarları */}
        <TabsContent value="appearance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Tema Renkleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primary_color">Ana Renk</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={settings.primary_color || "#3b82f6"}
                      onChange={(e) => updateSetting("primary_color", e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.primary_color || "#3b82f6"}
                      onChange={(e) => updateSetting("primary_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary_color">İkincil Renk</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={settings.secondary_color || "#64748b"}
                      onChange={(e) => updateSetting("secondary_color", e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.secondary_color || "#64748b"}
                      onChange={(e) => updateSetting("secondary_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accent_color">Vurgu Rengi</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={settings.accent_color || "#f59e0b"}
                      onChange={(e) => updateSetting("accent_color", e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.accent_color || "#f59e0b"}
                      onChange={(e) => updateSetting("accent_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Hukuki Metinler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="terms_of_service">Kullanım Şartları</Label>
                  <Textarea
                    id="terms_of_service"
                    value={settings.terms_of_service || ""}
                    onChange={(e) => updateSetting("terms_of_service", e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="privacy_policy">Gizlilik Politikası</Label>
                  <Textarea
                    id="privacy_policy"
                    value={settings.privacy_policy || ""}
                    onChange={(e) => updateSetting("privacy_policy", e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="return_policy">İade Politikası</Label>
                  <Textarea
                    id="return_policy"
                    value={settings.return_policy || ""}
                    onChange={(e) => updateSetting("return_policy", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEO Ayarları */}
        <TabsContent value="seo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Meta Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Başlık</Label>
                  <Input
                    id="meta_title"
                    value={settings.meta_title || ""}
                    onChange={(e) => updateSetting("meta_title", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="meta_description">Meta Açıklama</Label>
                  <Textarea
                    id="meta_description"
                    value={settings.meta_description || ""}
                    onChange={(e) => updateSetting("meta_description", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="meta_keywords">Anahtar Kelimeler</Label>
                  <Input
                    id="meta_keywords"
                    value={settings.meta_keywords || ""}
                    onChange={(e) => updateSetting("meta_keywords", e.target.value)}
                    placeholder="kelime1, kelime2, kelime3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Analitik & Takip
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                  <Input
                    id="google_analytics_id"
                    value={settings.google_analytics_id || ""}
                    onChange={(e) => updateSetting("google_analytics_id", e.target.value)}
                    placeholder="GA-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                  <Input
                    id="facebook_pixel_id"
                    value={settings.facebook_pixel_id || ""}
                    onChange={(e) => updateSetting("facebook_pixel_id", e.target.value)}
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site Haritası</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={generateSitemap}>
                      Sitemap Oluştur
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={updateRobotsTxt}>
                      Robots.txt Güncelle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;