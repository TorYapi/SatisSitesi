-- Create settings table to store site configuration
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings
CREATE POLICY "Admins can manage all settings"
  ON public.settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.settings (key, value, description, category) VALUES
('site_name', '"E-Commerce Platform"', 'Site adı', 'general'),
('site_description', '"Modern ve güvenilir e-ticaret platformu"', 'Site açıklaması', 'general'),
('contact_email', '"info@example.com"', 'İletişim e-postası', 'general'),
('contact_phone', '"+90 555 123 4567"', 'İletişim telefonu', 'general'),
('address', '"İstanbul, Türkiye"', 'Şirket adresi', 'general'),
('currency', '"TRY"', 'Ana para birimi', 'general'),
('tax_rate', '18', 'Vergi oranı (%)', 'general'),
('shipping_fee', '15', 'Kargo ücreti', 'general'),
('free_shipping_threshold', '150', 'Ücretsiz kargo limiti', 'general'),
('maintenance_mode', 'false', 'Bakım modu aktif mi', 'general'),
('allow_registration', 'true', 'Yeni üyelik açık mı', 'security'),
('require_email_verification', 'true', 'E-posta doğrulama zorunlu mu', 'security'),
('max_login_attempts', '5', 'Maksimum giriş denemesi', 'security'),
('session_timeout', '30', 'Oturum süresi (dakika)', 'security'),
('backup_frequency', '"daily"', 'Yedekleme sıklığı', 'security'),
('email_notifications', 'true', 'E-posta bildirimleri aktif mi', 'notifications'),
('sms_notifications', 'false', 'SMS bildirimleri aktif mi', 'notifications'),
('order_notifications', 'true', 'Sipariş bildirimleri aktif mi', 'notifications'),
('low_stock_threshold', '5', 'Düşük stok uyarı limiti', 'general'),
('terms_of_service', '"Hizmet şartları burada yer alacak..."', 'Kullanım şartları', 'legal'),
('privacy_policy', '"Gizlilik politikası burada yer alacak..."', 'Gizlilik politikası', 'legal'),
('return_policy', '"İade politikası burada yer alacak..."', 'İade politikası', 'legal'),
('primary_color', '"#3b82f6"', 'Ana renk', 'appearance'),
('secondary_color', '"#64748b"', 'İkincil renk', 'appearance'),
('accent_color', '"#f59e0b"', 'Vurgu rengi', 'appearance'),
('meta_title', '"E-Commerce Platform - Online Alışveriş"', 'Meta başlık', 'seo'),
('meta_description', '"Güvenilir e-ticaret platformu ile online alışveriş yapın"', 'Meta açıklama', 'seo'),
('meta_keywords', '"e-ticaret, online alışveriş, güvenli ödeme"', 'Anahtar kelimeler', 'seo'),
('google_analytics_id', '""', 'Google Analytics ID', 'seo'),
('facebook_pixel_id', '""', 'Facebook Pixel ID', 'seo');