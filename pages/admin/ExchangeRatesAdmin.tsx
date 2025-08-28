import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Euro,
  History
} from "lucide-react";

interface ExchangeRate {
  id: string;
  currency_code: string;
  rate_to_try: number;
  effective_date: string;
  created_at: string;
}

const ExchangeRatesAdmin = () => {
  const [currentRates, setCurrentRates] = useState<ExchangeRate[]>([]);
  const [historicalRates, setHistoricalRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newRates, setNewRates] = useState({
    USD: "",
    EUR: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      
      // Fetch current rates (today's rates)
      const { data: currentData, error: currentError } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('effective_date', new Date().toISOString().split('T')[0])
        .order('currency_code');

      if (currentError) throw currentError;

      // Fetch historical rates (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: historicalData, error: historicalError } = await supabase
        .from('exchange_rates')
        .select('*')
        .gte('effective_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('effective_date', { ascending: false })
        .order('currency_code');

      if (historicalError) throw historicalError;

      setCurrentRates(currentData || []);
      setHistoricalRates(historicalData || []);

      // Set current rates in form
      if (currentData) {
        const ratesMap: any = {};
        currentData.forEach(rate => {
          ratesMap[rate.currency_code] = rate.rate_to_try.toString();
        });
        setNewRates(ratesMap);
      }

    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast({
        title: "Hata",
        description: "Döviz kurları yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExchangeRates = async () => {
    try {
      setUpdating(true);
      const today = new Date().toISOString().split('T')[0];

      // Update or insert rates for today
      for (const [currency, rate] of Object.entries(newRates)) {
        if (!rate || parseFloat(rate) <= 0) continue;

        const { error } = await supabase
          .from('exchange_rates')
          .upsert({
            currency_code: currency,
            rate_to_try: parseFloat(rate),
            effective_date: today,
          }, {
            onConflict: 'currency_code,effective_date'
          });

        if (error) throw error;
      }

      await fetchExchangeRates();
      toast({
        title: "Başarılı",
        description: "Döviz kurları başarıyla güncellendi.",
      });
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      toast({
        title: "Hata",
        description: "Döviz kurları güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getCurrentRate = (currency: string) => {
    const rate = currentRates.find(r => r.currency_code === currency);
    return rate?.rate_to_try || 0;
  };

  const getYesterdayRate = (currency: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const rate = historicalRates.find(r => 
      r.currency_code === currency && r.effective_date === yesterdayStr
    );
    return rate?.rate_to_try || 0;
  };

  const getRateChange = (currency: string) => {
    const current = getCurrentRate(currency);
    const yesterday = getYesterdayRate(currency);
    
    if (yesterday === 0) return 0;
    return ((current - yesterday) / yesterday) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Döviz Kurları</h1>
            <p className="text-muted-foreground">Günlük döviz kurlarını yönetin</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Döviz Kurları</h1>
          <p className="text-muted-foreground">
            Günlük döviz kurlarını yönetin ve tüm ürün fiyatlarını etkileyin
          </p>
        </div>
        <Button variant="outline" onClick={fetchExchangeRates}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Current Rates Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">USD/TRY</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{getCurrentRate('USD').toFixed(4)}
            </div>
            <div className={`text-xs flex items-center ${
              getRateChange('USD') >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {getRateChange('USD') >= 0 ? '+' : ''}{getRateChange('USD').toFixed(2)}% dünden
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EUR/TRY</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{getCurrentRate('EUR').toFixed(4)}
            </div>
            <div className={`text-xs flex items-center ${
              getRateChange('EUR') >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {getRateChange('EUR') >= 0 ? '+' : ''}{getRateChange('EUR').toFixed(2)}% dünden
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Rates Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Kurları Güncelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usdRate">USD Kuru (1 USD = ? TRY)</Label>
              <Input
                id="usdRate"
                type="number"
                step="0.0001"
                value={newRates.USD}
                onChange={(e) => setNewRates(prev => ({ ...prev, USD: e.target.value }))}
                placeholder="32.5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eurRate">EUR Kuru (1 EUR = ? TRY)</Label>
              <Input
                id="eurRate"
                type="number"
                step="0.0001"
                value={newRates.EUR}
                onChange={(e) => setNewRates(prev => ({ ...prev, EUR: e.target.value }))}
                placeholder="35.0000"
              />
            </div>
          </div>
          <Button 
            onClick={updateExchangeRates} 
            disabled={updating || !newRates.USD || !newRates.EUR}
            className="w-full"
          >
            {updating ? "Güncelleniyor..." : "Kurları Güncelle"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Bu kurlar tüm ürünlerin TL fiyat hesaplamalarında kullanılacaktır.
          </p>
        </CardContent>
      </Card>

      {/* Historical Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Geçmiş Kurlar (Son 7 Gün)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>USD/TRY</TableHead>
                <TableHead>EUR/TRY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(new Set(historicalRates.map(r => r.effective_date)))
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map((date) => {
                  const usdRate = historicalRates.find(r => r.effective_date === date && r.currency_code === 'USD');
                  const eurRate = historicalRates.find(r => r.effective_date === date && r.currency_code === 'EUR');
                  
                  return (
                    <TableRow key={date}>
                      <TableCell>
                        <div className="font-medium">
                          {new Date(date).toLocaleDateString('tr-TR')}
                        </div>
                        {date === new Date().toISOString().split('T')[0] && (
                          <div className="text-xs text-muted-foreground">Bugün</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {usdRate ? `₺${usdRate.rate_to_try.toFixed(4)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {eurRate ? `₺${eurRate.rate_to_try.toFixed(4)}` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExchangeRatesAdmin;