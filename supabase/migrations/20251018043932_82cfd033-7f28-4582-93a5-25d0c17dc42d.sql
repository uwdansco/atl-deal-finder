-- Create price_history table to store flight price checks
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  outbound_date DATE,
  return_date DATE,
  booking_link TEXT,
  flight_details JSONB,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_history
CREATE POLICY "Anyone can view price history"
  ON public.price_history FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage price history"
  ON public.price_history FOR ALL
  USING (is_admin(auth.uid()));

-- Create index for better query performance
CREATE INDEX idx_price_history_destination ON public.price_history(destination_id);
CREATE INDEX idx_price_history_checked_at ON public.price_history(checked_at DESC);

-- Create user_destinations table to track what users are monitoring
CREATE TABLE IF NOT EXISTS public.user_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  price_threshold NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_alert_sent_at TIMESTAMP WITH TIME ZONE,
  alert_cooldown_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, destination_id)
);

-- Enable RLS
ALTER TABLE public.user_destinations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_destinations
CREATE POLICY "Users can view own destinations"
  ON public.user_destinations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own destinations"
  ON public.user_destinations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own destinations"
  ON public.user_destinations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own destinations"
  ON public.user_destinations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all destinations"
  ON public.user_destinations FOR ALL
  USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_user_destinations_updated_at
  BEFORE UPDATE ON public.user_destinations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add columns to price_alerts table for enhanced tracking
ALTER TABLE public.price_alerts 
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS deal_quality TEXT,
  ADD COLUMN IF NOT EXISTS savings_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS avg_90day_price NUMERIC,
  ADD COLUMN IF NOT EXISTS all_time_low NUMERIC,
  ADD COLUMN IF NOT EXISTS email_opened BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS link_clicked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_link TEXT;