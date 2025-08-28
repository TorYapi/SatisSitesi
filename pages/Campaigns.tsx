import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/sections/Footer";
import { Calendar, Tag, ArrowRight } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string;
  code: string;
  campaign_type: string;
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  image_url?: string;
  button_text?: string;
  button_link?: string;
  text_color?: string;
  background_color?: string;
}

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCampaignTypeText = (type: string) => {
    switch (type) {
      case 'percentage': return 'Yüzde İndirim';
      case 'fixed_amount': return 'Sabit Tutar İndirim';
      case 'free_shipping': return 'Ücretsiz Kargo';
      case 'buy_x_get_y': return 'Al X Öde Y';
      default: return 'Kampanya';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-primary text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Kampanyalar</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Size özel hazırladığımız kampanyalarla tasarruf edin ve en iyi fırsatları kaçırmayın!
            </p>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="container mx-auto px-4 py-12">
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              Şu anda aktif kampanya bulunmuyor
            </h3>
            <p className="text-muted-foreground mb-6">
              Yeni kampanyalardan haberdar olmak için bizi takip etmeye devam edin.
            </p>
            <Link to="/products">
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors">
                Ürünleri İncele
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card 
                key={campaign.id} 
                className="overflow-hidden hover-lift transition-all duration-300 group"
                style={{
                  backgroundColor: campaign.background_color || undefined,
                  color: campaign.text_color || undefined
                }}
              >
                {campaign.image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={campaign.image_url}
                      alt={campaign.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {getCampaignTypeText(campaign.campaign_type)}
                    </Badge>
                    {campaign.code && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {campaign.code}
                      </Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {campaign.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {campaign.description}
                  </p>

                  <div className="flex items-center text-xs text-muted-foreground space-x-4">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(campaign.start_date)}
                    </div>
                    <span>-</span>
                    <div>{formatDate(campaign.end_date)}</div>
                  </div>

                  {campaign.discount_value && campaign.campaign_type !== 'free_shipping' && (
                    <div className="bg-primary/10 rounded-lg p-3 text-center">
                      <span className="text-lg font-bold text-primary">
                        {campaign.campaign_type === 'percentage' ? '%' : ''}
                        {campaign.discount_value}
                        {campaign.campaign_type === 'fixed_amount' ? ' TL' : ''}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">İndirim</p>
                    </div>
                  )}

                  {campaign.button_link && (
                    <a
                      href={campaign.button_link}
                      className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium group"
                    >
                      {campaign.button_text || 'Kampanyayı Gör'}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Campaigns;