-- Create exchange rates table for daily currency rates
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_code TEXT NOT NULL CHECK (currency_code IN ('USD', 'EUR')),
  rate_to_try NUMERIC(10,4) NOT NULL CHECK (rate_to_try > 0),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(currency_code, effective_date)
);

-- Enable Row Level Security
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for exchange rates
CREATE POLICY "Admins can manage exchange rates" 
ON public.exchange_rates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Public can view current exchange rates" 
ON public.exchange_rates 
FOR SELECT 
USING (effective_date = CURRENT_DATE);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exchange_rates_updated_at
BEFORE UPDATE ON public.exchange_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default exchange rates
INSERT INTO public.exchange_rates (currency_code, rate_to_try, effective_date) VALUES
('USD', 32.50, CURRENT_DATE),
('EUR', 35.00, CURRENT_DATE);

-- Create function to get current exchange rate
CREATE OR REPLACE FUNCTION public.get_current_exchange_rate(currency TEXT)
RETURNS NUMERIC AS $$
DECLARE
  current_rate NUMERIC;
BEGIN
  SELECT rate_to_try INTO current_rate
  FROM public.exchange_rates
  WHERE currency_code = currency AND effective_date = CURRENT_DATE
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(current_rate, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to convert price to TRY
CREATE OR REPLACE FUNCTION public.convert_to_try(price NUMERIC, from_currency TEXT)
RETURNS NUMERIC AS $$
BEGIN
  IF from_currency = 'TRY' THEN
    RETURN price;
  ELSE
    RETURN price * get_current_exchange_rate(from_currency);
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;