import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SanitizedInput } from "@/components/ui/input-sanitized";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import { User, Mail, Phone, Lock, Save, Eye, EyeOff } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    user_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Get user profile from customers table
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (customerError && customerError.code !== 'PGRST116') {
        throw customerError;
      }

      if (customerData) {
        setProfile({
          id: customerData.id,
          user_id: customerData.user_id,
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          email: customerData.email,
          phone: customerData.phone || "",
        });
      } else {
        // Create customer record if it doesn't exist
        setProfile({
          id: "",
          user_id: user?.id || "",
          first_name: "",
          last_name: "",
          email: user?.email || "",
          phone: "",
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Hata",
        description: "Profil bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      if (!profile.first_name || !profile.last_name) {
        toast({
          title: "Hata",
          description: "İsim ve soyisim zorunludur.",
          variant: "destructive",
        });
        return;
      }

      const profileData = {
        user_id: user?.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone || null,
      };

      if (profile.id) {
        // Update existing profile
        const { error } = await supabase
          .from('customers')
          .update(profileData)
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('customers')
          .insert([profileData])
          .select()
          .single();

        if (error) throw error;
        
        setProfile(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Başarılı",
        description: "Profil bilgileriniz güncellendi.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Hata",
        description: "Profil güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      setChangingPassword(true);

      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        toast({
          title: "Hata",
          description: "Tüm şifre alanları zorunludur.",
          variant: "destructive",
        });
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast({
          title: "Hata",
          description: "Yeni şifreler eşleşmiyor.",
          variant: "destructive",
        });
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        toast({
          title: "Hata",
          description: "Yeni şifre en az 6 karakter olmalıdır.",
          variant: "destructive",
        });
        return;
      }

      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        toast({
          title: "Hata",
          description: "Mevcut şifreniz yanlış.",
          variant: "destructive",
        });
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Şifreniz başarıyla değiştirildi.",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Hata",
        description: "Şifre değiştirilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profil</h1>
            <p className="text-muted-foreground">
              Profil bilgilerinizi görüntülemek için giriş yapmanız gerekiyor.
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
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Profil Bilgilerim</h1>
            <p className="text-muted-foreground">
              Hesap bilgilerinizi buradan güncelleyebilirsiniz.
            </p>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Kişisel Bilgiler</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">İsim *</Label>
                  <SanitizedInput
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    placeholder="İsminizi girin"
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Soyisim *</Label>
                  <SanitizedInput
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    placeholder="Soyisminizi girin"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <SanitizedInput
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="E-posta adresinizi girin"
                    className="pl-9"
                    disabled={true} // Email cannot be changed through this form
                    validationType="email"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  E-posta adresi değiştirilemez.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon Numarası</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <SanitizedInput
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="Telefon numaranızı girin"
                    className="pl-9"
                    disabled={loading}
                    validationType="phone"
                  />
                </div>
              </div>

              <Button onClick={saveProfile} disabled={loading || saving} className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Kaydediliyor..." : "Bilgileri Kaydet"}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Şifre Değiştir</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Mevcut Şifre *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <SanitizedInput
                    id="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Mevcut şifrenizi girin"
                    className="pl-9 pr-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Yeni Şifre *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <SanitizedInput
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Yeni şifrenizi girin"
                    className="pl-9 pr-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Yeni Şifre Tekrar *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <SanitizedInput
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Yeni şifrenizi tekrar girin"
                    className="pl-9 pr-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={changePassword} disabled={changingPassword} className="w-full md:w-auto">
                <Lock className="w-4 h-4 mr-2" />
                {changingPassword ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;