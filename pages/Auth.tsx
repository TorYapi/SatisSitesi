import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SanitizedInput } from "@/components/ui/input-sanitized";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";

// Social login icons as SVG components
const GoogleIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>;
const FacebookIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>;
interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}
const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: ""
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const {
    toast
  } = useToast();

  // Geri yönlendirme için location state kontrol et
  const from = (location.state as any)?.from || "/";

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkSession();
  }, [navigate]);
  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach(key => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      setLoading(true);
      cleanupAuthState();
      const {
        data,
        error
      } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) {
        toast({
          title: "Hata",
          description: `${provider === 'google' ? 'Google' : 'Facebook'} ile giriş yapılırken bir hata oluştu.`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Sosyal giriş yapılırken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        title: "Hata",
        description: "Lütfen e-posta ve şifrenizi girin.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({
          scope: 'global'
        });
      } catch (err) {
        // Continue even if this fails
      }
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      if (error) {
        let message = "Giriş yapılırken bir hata oluştu.";
        if (error.message.includes("Invalid login credentials")) {
          message = "E-posta veya şifre hatalı.";
        } else if (error.message.includes("Email not confirmed")) {
          message = "E-posta adresinizi doğrulamanız gerekiyor.";
        }
        toast({
          title: "Giriş Hatası",
          description: message,
          variant: "destructive"
        });
        return;
      }
      if (data.user) {
        toast({
          title: "Başarılı!",
          description: "Giriş yapıldı, yönlendiriliyorsunuz..."
        });
        setTimeout(() => {
          navigate(from);
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Giriş yapılırken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Password strength validation
  const validatePasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (pwd.length < 8) return 'weak';
    
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    const criteria = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (criteria >= 3 && pwd.length >= 12) return 'strong';
    if (criteria >= 2 && pwd.length >= 8) return 'medium';
    return 'weak';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun.",
        variant: "destructive"
      });
      return;
    }
    // Enhanced password validation
    const strength = validatePasswordStrength(formData.password);
    if (strength === 'weak') {
      toast({
        title: "Zayıf Şifre",
        description: "Lütfen en az 8 karakter, büyük/küçük harf, rakam ve özel karakter içeren güçlü bir şifre kullanın.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({
          scope: 'global'
        });
      } catch (err) {
        // Continue even if this fails
      }
      const redirectUrl = `${window.location.origin}/`;
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone
          }
        }
      });
      if (error) {
        let message = "Kayıt olurken bir hata oluştu.";
        if (error.message.includes("User already registered")) {
          message = "Bu e-posta adresi zaten kayıtlı.";
        } else if (error.message.includes("Password should be at least")) {
          message = "Şifre en az 6 karakter olmalıdır.";
        }
        toast({
          title: "Kayıt Hatası",
          description: message,
          variant: "destructive"
        });
        return;
      }
      if (data.user) {
        toast({
          title: "Başarılı!",
          description: "Kayıt tamamlandı! E-posta adresinizi kontrol edin."
        });

        // If auto-confirm is enabled, redirect
        if (data.session) {
          setTimeout(() => {
            navigate(from);
          }, 1000);
        }
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Kayıt olurken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value
    };
    setFormData(newFormData);
    
    // Update password strength when password changes
    if (e.target.name === 'password') {
      setPasswordStrength(validatePasswordStrength(e.target.value));
    }
  };
  const defaultTab = searchParams.get("tab") || "signin";
  return <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-700 mb-2">TORSHOP</h1>
            
          </div>

          <Card className="border-0 shadow-elegant bg-card/80 backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Hoş Geldiniz</CardTitle>
              <CardDescription className="text-center">
                E-ticaret deneyiminize başlayın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Giriş Yap</TabsTrigger>
                  <TabsTrigger value="signup">Kayıt Ol</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <SanitizedInput id="email" name="email" type="email" placeholder="ornek@email.com" value={formData.email} onChange={handleInputChange} className="pl-10" required validationType="email" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Şifre</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <SanitizedInput id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleInputChange} className="pl-10 pr-10" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading} variant="gradient">
                      {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                    </Button>

                    {/* Social Login Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">veya</span>
                      </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-3">
                      <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialLogin('google')} disabled={loading}>
                        <GoogleIcon />
                        <span className="ml-2">Google ile Devam Et</span>
                      </Button>
                      
                      <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialLogin('facebook')} disabled={loading}>
                        <FacebookIcon />
                        <span className="ml-2">Facebook ile Devam Et</span>
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Ad</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <SanitizedInput id="firstName" name="firstName" type="text" placeholder="Adınız" value={formData.firstName} onChange={handleInputChange} className="pl-10" required />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Soyad</Label>
                        <SanitizedInput id="lastName" name="lastName" type="text" placeholder="Soyadınız" value={formData.lastName} onChange={handleInputChange} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">E-posta</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <SanitizedInput id="signup-email" name="email" type="email" placeholder="ornek@email.com" value={formData.email} onChange={handleInputChange} className="pl-10" required validationType="email" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon (Opsiyonel)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <SanitizedInput id="phone" name="phone" type="tel" placeholder="+90 555 123 45 67" value={formData.phone} onChange={handleInputChange} className="pl-10" validationType="phone" />
                      </div>
                    </div>

                     <div className="space-y-2">
                       <Label htmlFor="signup-password">Şifre</Label>
                       <div className="relative">
                         <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                         <SanitizedInput id="signup-password" name="password" type={showPassword ? "text" : "password"} placeholder="En az 8 karakter, güçlü şifre" value={formData.password} onChange={handleInputChange} className="pl-10 pr-10" required />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                           {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                         </button>
                       </div>
                       {formData.password && (
                         <div className="space-y-1">
                           <div className="flex gap-1">
                             <div className={`h-1 w-full rounded ${passwordStrength === 'weak' ? 'bg-destructive' : passwordStrength === 'medium' ? 'bg-warning' : 'bg-primary'}`} />
                             <div className={`h-1 w-full rounded ${passwordStrength === 'medium' || passwordStrength === 'strong' ? passwordStrength === 'medium' ? 'bg-warning' : 'bg-primary' : 'bg-muted'}`} />
                             <div className={`h-1 w-full rounded ${passwordStrength === 'strong' ? 'bg-primary' : 'bg-muted'}`} />
                           </div>
                           <p className="text-xs text-muted-foreground">
                             Şifre gücü: {passwordStrength === 'weak' ? 'Zayıf' : passwordStrength === 'medium' ? 'Orta' : 'Güçlü'}
                           </p>
                         </div>
                       )}
                     </div>

                    <Button type="submit" className="w-full" disabled={loading} variant="gradient">
                      {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
                    </Button>

                    {/* Social Login Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">veya</span>
                      </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-3">
                      <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialLogin('google')} disabled={loading}>
                        <GoogleIcon />
                        <span className="ml-2">Google ile Devam Et</span>
                      </Button>
                      
                      <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialLogin('facebook')} disabled={loading}>
                        <FacebookIcon />
                        <span className="ml-2">Facebook ile Devam Et</span>
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>;
};
export default Auth;