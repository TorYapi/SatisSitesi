import Header from "@/components/layout/Header";
import HeroSection from "@/components/sections/HeroSection";
import CategorySection from "@/components/sections/CategorySection";
import ProductSection from "@/components/sections/ProductSection";
import Footer from "@/components/sections/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategorySection />
        <ProductSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
