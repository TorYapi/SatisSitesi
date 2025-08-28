import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Globe,
  CreditCard,
  Mail,
  Moon,
  Sun,
  Monitor,
  Eye,
  Save,
  Trash2
} from "lucide-react";

interface UserSettings {
  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
  stockAlerts: boolean;
  
  // Privacy Settings
  profileVisibility: 'public' | 'private';
  showPurchaseHistory: boolean;
  allowDataCollection: boolean;
  
  // Display Settings
  theme: 'light' | 'dark' | 'system';
  
  // Shopping Preferences
  savePaymentInfo: boolean;
  autoApplyCoupons: boolean;
  showOutOfStock: boolean;
  defaultShippingAddress: boolean;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotionalEmails: false,
    stockAlerts: true,
    
    // Privacy Settings
    profileVisibility: 'private',
    showPurchaseHistory: false,
    allowDataCollection: false,
    
    // Display Settings
    theme: 'system',
    
    // Shopping Preferences
    savePaymentInfo: false,
    autoApplyCoupons: true,
    showOutOfStock: true,
    defaultShippingAddress: true,
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
  };

  const loadSettings = () => {
    // Load theme from localStorage first
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      applyTheme(savedTheme);
    }
    
    // Load other settings from localStorage
    const savedSettings = localStorage.getItem(`user_settings_${user?.id}`);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ 
          ...settings, 
          ...parsed,
          theme: savedTheme || parsed.theme || 'system'
        });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    } else if (savedTheme) {
      setSettings(prev => ({ ...prev, theme: savedTheme }));
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage
      localStorage.setItem(`user_settings_${user?.id}`, JSON.stringify(settings));
      
      // Apply theme immediately
      applyTheme(settings.theme);
      
      toast({
        title: "Başarılı",
        description: "Ayarlarınız kaydedildi.",
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

  const resetSettings = () => {
    if (confirm('Tüm ayarları varsayılan değerlere sıfırlamak istediğinizden emin misiniz?')) {
      localStorage.removeItem(`user_settings_${user?.id}`);
      localStorage.removeItem('theme');
      
      const defaultSettings = {
        emailNotifications: true,
        smsNotifications: false,
        orderUpdates: true,
        promotionalEmails: false,
        stockAlerts: true,
        profileVisibility: 'private' as const,
        showPurchaseHistory: false,
        allowDataCollection: false,
        theme: 'system' as const,
        savePaymentInfo: false,
        autoApplyCoupons: true,
        showOutOfStock: true,
        defaultShippingAddress: true,
      };
      
      setSettings(defaultSettings);
      applyTheme('system');
      
      toast({
        title: "Başarılı",
        description: "Ayarlar varsayılan değerlere sıfırlandı.",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Ayarlar</h1>
            <p className="text-muted-foreground">
              Ayarları görüntülemek için giriş yapmanız gerekiyor.
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
            <h1 className="text-3xl font-bold">Ayarlar</h1>
            <p className="text-muted-foreground">
              Hesap tercihlerinizi ve uygulama ayarlarınızı yönetin.
            </p>
          </div>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Bildirim Ayarları</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-posta Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">
                    Önemli güncellemeler için e-posta alın
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">
                    Sipariş güncellemeleri için SMS alın
                  </p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sipariş Güncellemeleri</Label>
                  <p className="text-sm text-muted-foreground">
                    Sipariş durumu değişikliklerinde bildirim alın
                  </p>
                </div>
                <Switch
                  checked={settings.orderUpdates}
                  onCheckedChange={(checked) => setSettings({ ...settings, orderUpdates: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Promosyon E-postaları</Label>
                  <p className="text-sm text-muted-foreground">
                    Kampanya ve indirim bildirimlerini alın
                  </p>
                </div>
                <Switch
                  checked={settings.promotionalEmails}
                  onCheckedChange={(checked) => setSettings({ ...settings, promotionalEmails: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Stok Uyarıları</Label>
                  <p className="text-sm text-muted-foreground">
                    Favori ürünleriniz tekrar stoka girdiğinde bildirim alın
                  </p>
                </div>
                <Switch
                  checked={settings.stockAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, stockAlerts: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Gizlilik Ayarları</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Profil Görünürlüğü</Label>
                <RadioGroup
                  value={settings.profileVisibility}
                  onValueChange={(value) => setSettings({ ...settings, profileVisibility: value as 'public' | 'private' })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public">Herkese Açık</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private">Gizli</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Satın Alma Geçmişini Göster</Label>
                  <p className="text-sm text-muted-foreground">
                    Diğer kullanıcılar satın alma geçmişinizi görebilir
                  </p>
                </div>
                <Switch
                  checked={settings.showPurchaseHistory}
                  onCheckedChange={(checked) => setSettings({ ...settings, showPurchaseHistory: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Veri Toplama İzni</Label>
                  <p className="text-sm text-muted-foreground">
                    Hizmet iyileştirme için anonim veri toplama
                  </p>
                </div>
                <Switch
                  checked={settings.allowDataCollection}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowDataCollection: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="w-5 h-5" />
                <span>Görünüm Ayarları</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => {
                    const newTheme = value as 'light' | 'dark' | 'system';
                    setSettings({ ...settings, theme: newTheme });
                    applyTheme(newTheme);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="w-4 h-4 mr-2" />
                        Açık Tema
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="w-4 h-4 mr-2" />
                        Koyu Tema
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center">
                        <Monitor className="w-4 h-4 mr-2" />
                        Sistem Ayarı
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Tercih ettiğiniz tema ile uygulamayı kullanın
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Shopping Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Alışveriş Tercihleri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ödeme Bilgilerini Kaydet</Label>
                  <p className="text-sm text-muted-foreground">
                    Hızlı ödeme için kart bilgilerini güvenli şekilde kaydedin
                  </p>
                </div>
                <Switch
                  checked={settings.savePaymentInfo}
                  onCheckedChange={(checked) => setSettings({ ...settings, savePaymentInfo: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Kuponları Otomatik Uygula</Label>
                  <p className="text-sm text-muted-foreground">
                    Uygun kuponları otomatik olarak sepete uygula
                  </p>
                </div>
                <Switch
                  checked={settings.autoApplyCoupons}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoApplyCoupons: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tükenen Ürünleri Göster</Label>
                  <p className="text-sm text-muted-foreground">
                    Stokta olmayan ürünleri listede göster
                  </p>
                </div>
                <Switch
                  checked={settings.showOutOfStock}
                  onCheckedChange={(checked) => setSettings({ ...settings, showOutOfStock: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Varsayılan Teslimat Adresi</Label>
                  <p className="text-sm text-muted-foreground">
                    Siparişlerde varsayılan adresi otomatik seç
                  </p>
                </div>
                <Switch
                  checked={settings.defaultShippingAddress}
                  onCheckedChange={(checked) => setSettings({ ...settings, defaultShippingAddress: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button onClick={saveSettings} disabled={saving} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </Button>
            
            <Button onClick={resetSettings} variant="outline" className="w-full sm:w-auto">
              <Trash2 className="w-4 h-4 mr-2" />
              Varsayılana Sıfırla
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Settings;