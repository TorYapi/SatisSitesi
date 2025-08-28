import { ArrowLeft, Mail, Phone, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SanitizedInput } from "@/components/ui/input-sanitized";
import { SanitizedTextarea } from "@/components/ui/textarea-sanitized";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";

const Contact = () => {
  const contactInfo = [
    {
      icon: <Mail className="h-5 w-5" />,
      title: "E-posta",
      value: "info@shopzone.com",
      link: "mailto:info@shopzone.com"
    },
    {
      icon: <Phone className="h-5 w-5" />,
      title: "Telefon",
      value: "+90 212 555 0123",
      link: "tel:+902125550123"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Adres",
      value: "Maslak Mahallesi, Büyükdere Cd. No:123, Sarıyer/İstanbul",
      link: "#"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Çalışma Saatleri",
      value: "Pazartesi - Cuma: 09:00 - 18:00",
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">İletişim</h1>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Bize Ulaşın</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ad</Label>
                    <SanitizedInput id="firstName" placeholder="Adınız" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Soyad</Label>
                    <SanitizedInput id="lastName" placeholder="Soyadınız" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <SanitizedInput id="email" type="email" placeholder="ornek@email.com" validationType="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <SanitizedInput id="phone" type="tel" placeholder="+90 555 123 45 67" validationType="phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Konu</Label>
                  <SanitizedInput id="subject" placeholder="Mesaj konusu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mesaj</Label>
                  <SanitizedTextarea
                    id="message" 
                    placeholder="Mesajınızı buraya yazın..."
                    rows={5}
                  />
                </div>
                <Button className="w-full">
                  Mesaj Gönder
                </Button>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>İletişim Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="text-primary mt-1">
                        {info.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{info.title}</h4>
                        <p className="text-muted-foreground">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card>
                <CardHeader>
                  <CardTitle>Sık Sorulan Sorular</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Teslimat ne kadar sürer?</h4>
                    <p className="text-sm text-muted-foreground">
                      Genellikle 1-3 iş günü içinde kargoya teslim edilir.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">İade politikanız nedir?</h4>
                    <p className="text-sm text-muted-foreground">
                      7 gün içinde koşulsuz iade hakkınız bulunmaktadır (üründen ürüne değişiklik gösterebilmektedir).
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Hangi ödeme yöntemlerini kabul ediyorsunuz?</h4>
                    <p className="text-sm text-muted-foreground">
                      Kredi kartı, banka kartı ve kapıda ödeme seçenekleri mevcuttur.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;