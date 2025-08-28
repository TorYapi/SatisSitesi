import { ArrowLeft, Heart, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
const About = () => {
  const features = [{
    icon: <Heart className="h-8 w-8 text-primary" />,
    title: "Müşteri Memnuniyeti",
    description: "Müşterilerimizin memnuniyeti bizim için en önemli önceliktir."
  }, {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: "Güvenli Alışveriş",
    description: "Tüm ödemeleriniz SSL ile şifrelenir ve güvenle işlenir."
  }, {
    icon: <Truck className="h-8 w-8 text-primary" />,
    title: "Hızlı Teslimat",
    description: "Siparişlerinizi en kısa sürede kapınıza teslim ediyoruz."
  }];
  return <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Hakkımızda</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">TORSHOP</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">2025 yılında kurulan TorShop, müşterilerine en kaliteli ürünleri en uygun fiyatlarla sunmayı hedefleyen modern bir e-ticaret platformudur.</p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Misyonumuz</h3>
                <p className="text-muted-foreground">
                  Müşterilerimize kaliteli ürünler sunarak, online alışveriş deneyimini en üst düzeye çıkarmak ve günlük hayatlarını kolaylaştırmaktır.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Vizyonumuz</h3>
                <p className="text-muted-foreground">Türkiye'nin ve Kıbrıs'ın en güvenilir ve tercih edilen e-ticaret platformu olmak, yenilikçi çözümlerle sektöre öncülük etmektir.</p>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8 text-violet-600">Neden TORSHOP?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>)}
            </div>
          </div>

          {/* Story */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Hikayemiz</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>TorShop, e-ticaret sektöründeki deneyimimizi ve teknoloji tutkumuzu birleştirerek doğdu. Amacımız, müşterilerimize sadece ürün satmak değil, aynı zamanda sektöre unutulmaz bir alışveriş deneyimi sunmaktır.</p>
                <p>
                  Kurulduğumuz günden bu yana, kalite standartlarımızdan ödün vermeden, sürekli gelişen ürün yelpazemiz ve 
                  müşteri odaklı hizmet anlayışımızla sektörde fark yaratmaya devam ediyoruz.
                </p>
                <p>
                  Teknolojinin sunduğu olanakları en iyi şekilde kullanarak, online alışverişi daha güvenli, 
                  daha kolay ve daha keyifli hale getirmeye odaklanıyoruz.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>;
};
export default About;