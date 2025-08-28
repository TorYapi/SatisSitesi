import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { validateURL } from "@/lib/security";

interface Campaign {
  id: string;
  name: string;
  description: string;
  image_url: string;
  background_color: string;
  text_color: string;
  button_text: string;
  button_link: string;
  discount_value: number;
  campaign_type: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  applicable_categories: string[] | null;
  applicable_products: string[] | null;
}

const HeroSection = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (campaigns.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % campaigns.length);
      }, 5000); // 5 saniyede bir değişir

      return () => clearInterval(timer);
    }
  }, [campaigns.length]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % campaigns.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  };

  const isExpired = (endDate: string) => {
    return endDate && new Date(endDate) < new Date();
  };

  const getPlaceholderImage = (index: number) => {
    const placeholders = [
      'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=1920&h=1080',
      'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=1920&h=1080',
      'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=1920&h=1080',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&h=1080'
    ];
    return placeholders[index % placeholders.length];
  };

  if (loading) {
    return (
      <section className="relative min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-6 sm:h-8 bg-white/20 rounded-lg w-48 sm:w-64 mx-auto mb-4"></div>
              <div className="h-3 sm:h-4 bg-white/20 rounded-lg w-64 sm:w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (campaigns.length === 0) {
    return (
      <section className="relative min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-4 px-4">
              Yakında Yeni Kampanyalar!
            </h2>
            <p className="text-white/80 mb-8 text-sm sm:text-base px-4">
              Harika kampanyalarımız için bizi takip etmeye devam edin.
            </p>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-sm sm:text-base"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ürünleri İncele
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const currentCampaign = campaigns[currentSlide];

  return (
    <section className="relative min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `url(${currentCampaign.image_url || getPlaceholderImage(currentSlide)})`,
        }}
      />
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          backgroundColor: currentCampaign.background_color + '90', // 90 for opacity
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Campaign Content */}
          <div className="space-y-4 sm:space-y-6 px-4">
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight transition-all duration-1000"
              style={{ color: currentCampaign.text_color }}
            >
              {currentCampaign.name}
            </h1>

            {currentCampaign.description && (
              <p 
                className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 max-w-xs sm:max-w-lg md:max-w-2xl mx-auto leading-relaxed transition-all duration-1000 px-2"
                style={{ color: currentCampaign.text_color + 'E0' }} // E0 for slight transparency
              >
                {currentCampaign.description}
              </p>
            )}

            {/* Discount Display */}
            {currentCampaign.discount_value && (
              <div className="mb-6 sm:mb-8">
                <div 
                  className="inline-block text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold mb-2"
                  style={{ color: currentCampaign.text_color }}
                >
                  %{currentCampaign.discount_value}
                </div>
                <div 
                  className="text-base sm:text-lg md:text-xl lg:text-2xl"
                  style={{ color: currentCampaign.text_color + 'C0' }}
                >
                  İndirim Fırsatı
                </div>
              </div>
            )}

            {/* CTA Button */}
            {currentCampaign.button_text && (
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  className="bg-white/90 text-gray-900 hover:bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                  onClick={() => {
                    if (currentCampaign.button_link) {
                      const validatedUrl = validateURL(currentCampaign.button_link);
                      if (validatedUrl) {
                        window.open(validatedUrl, '_blank', 'noopener,noreferrer');
                      }
                    } else {
                      // Navigate to products with campaign filter
                      const campaignParams = new URLSearchParams();
                      campaignParams.set('campaign', currentCampaign.id);
                      if (currentCampaign.applicable_categories?.length) {
                        campaignParams.set('categories', currentCampaign.applicable_categories.join(','));
                      }
                      if (currentCampaign.applicable_products?.length) {
                        campaignParams.set('products', currentCampaign.applicable_products.join(','));
                      }
                      window.location.href = `/#products?${campaignParams.toString()}`;
                    }
                  }}
                >
                  {currentCampaign.button_text}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Controls */}
        {campaigns.length > 1 && (
          <>
            {/* Previous/Next Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 sm:p-3 transition-all duration-300 group"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 sm:p-3 transition-all duration-300 group"
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 sm:space-x-3">
              {campaigns.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-white scale-110' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Campaign Counter */}
        {campaigns.length > 1 && (
          <div className="absolute top-4 sm:top-8 right-4 sm:right-8 bg-white/20 backdrop-blur-sm rounded-lg px-2 sm:px-4 py-1 sm:py-2">
            <span className="text-white text-xs sm:text-sm font-medium">
              {currentSlide + 1} / {campaigns.length}
            </span>
          </div>
        )}
      </div>

      {/* Animated Background Elements */}
      <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-10 h-10 sm:w-20 sm:h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-16 h-16 sm:w-32 sm:h-32 bg-white/20 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-16 sm:h-16 bg-white/20 rounded-full blur-xl animate-pulse delay-500" />
    </section>
  );
};

export default HeroSection;