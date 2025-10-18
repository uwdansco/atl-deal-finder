-- Create price_statistics table
CREATE TABLE IF NOT EXISTS public.price_statistics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id uuid NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  avg_7day decimal,
  avg_30day decimal,
  avg_90day decimal,
  all_time_low decimal,
  all_time_high decimal,
  percentile_25 decimal,
  percentile_50 decimal,
  percentile_75 decimal,
  std_deviation decimal,
  total_samples integer,
  last_calculated timestamp with time zone,
  UNIQUE(destination_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_price_stats_dest ON public.price_statistics(destination_id);

-- Enable RLS
ALTER TABLE public.price_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view price statistics" 
ON public.price_statistics 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage price statistics" 
ON public.price_statistics 
FOR ALL 
USING (is_admin(auth.uid()));

-- Function to refresh price statistics
CREATE OR REPLACE FUNCTION public.refresh_price_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update statistics for each destination
  INSERT INTO public.price_statistics (
    destination_id,
    avg_7day,
    avg_30day,
    avg_90day,
    all_time_low,
    all_time_high,
    percentile_25,
    percentile_50,
    percentile_75,
    std_deviation,
    total_samples,
    last_calculated
  )
  SELECT 
    d.id as destination_id,
    (SELECT AVG(price) FROM public.price_history 
     WHERE destination_id = d.id 
     AND checked_at >= NOW() - INTERVAL '7 days') as avg_7day,
    (SELECT AVG(price) FROM public.price_history 
     WHERE destination_id = d.id 
     AND checked_at >= NOW() - INTERVAL '30 days') as avg_30day,
    (SELECT AVG(price) FROM public.price_history 
     WHERE destination_id = d.id 
     AND checked_at >= NOW() - INTERVAL '90 days') as avg_90day,
    (SELECT MIN(price) FROM public.price_history 
     WHERE destination_id = d.id) as all_time_low,
    (SELECT MAX(price) FROM public.price_history 
     WHERE destination_id = d.id) as all_time_high,
    (SELECT PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price) 
     FROM public.price_history WHERE destination_id = d.id) as percentile_25,
    (SELECT PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY price) 
     FROM public.price_history WHERE destination_id = d.id) as percentile_50,
    (SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price) 
     FROM public.price_history WHERE destination_id = d.id) as percentile_75,
    (SELECT STDDEV(price) FROM public.price_history 
     WHERE destination_id = d.id) as std_deviation,
    (SELECT COUNT(*) FROM public.price_history 
     WHERE destination_id = d.id) as total_samples,
    NOW() as last_calculated
  FROM public.destinations d
  WHERE d.is_active = true
  ON CONFLICT (destination_id) 
  DO UPDATE SET
    avg_7day = EXCLUDED.avg_7day,
    avg_30day = EXCLUDED.avg_30day,
    avg_90day = EXCLUDED.avg_90day,
    all_time_low = EXCLUDED.all_time_low,
    all_time_high = EXCLUDED.all_time_high,
    percentile_25 = EXCLUDED.percentile_25,
    percentile_50 = EXCLUDED.percentile_50,
    percentile_75 = EXCLUDED.percentile_75,
    std_deviation = EXCLUDED.std_deviation,
    total_samples = EXCLUDED.total_samples,
    last_calculated = EXCLUDED.last_calculated;
END;
$$;

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily refresh at 3:00 AM EST (8:00 AM UTC)
SELECT cron.schedule(
  'refresh-price-statistics-daily',
  '0 8 * * *',
  $$
  SELECT public.refresh_price_statistics();
  $$
);