-- Add missing columns to subscribers table
ALTER TABLE public.subscribers 
  ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Rename subscribed_at to match (keep both for now to preserve data)
-- We'll migrate the data from subscribed_at to created_at
UPDATE public.subscribers SET created_at = subscribed_at;

-- Add created_at to destinations table
ALTER TABLE public.destinations 
  ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create deals table (proper structure)
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  outbound_date DATE NOT NULL,
  return_date DATE NOT NULL,
  booking_link TEXT NOT NULL,
  sent_to_subscribers BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create sent_emails table
CREATE TABLE public.sent_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  subscriber_count INTEGER NOT NULL,
  subject TEXT NOT NULL,
  open_rate DECIMAL(5, 2),
  click_rate DECIMAL(5, 2),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sent_emails
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

-- Create user roles system (proper admin implementation)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'admin'
  )
$$;

-- Drop old public policies
DROP POLICY IF EXISTS "Anyone can view destinations" ON public.destinations;
DROP POLICY IF EXISTS "Anyone can view price alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Anyone can insert subscribers" ON public.subscribers;

-- NEW RLS POLICIES

-- Subscribers: Public can insert, only admins can read/update
CREATE POLICY "Anyone can subscribe"
ON public.subscribers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all subscribers"
ON public.subscribers
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update subscribers"
ON public.subscribers
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete subscribers"
ON public.subscribers
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Destinations: Only admins can manage
CREATE POLICY "Admins can view destinations"
ON public.destinations
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert destinations"
ON public.destinations
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update destinations"
ON public.destinations
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete destinations"
ON public.destinations
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Deals: Only admins can manage
CREATE POLICY "Admins can view deals"
ON public.deals
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert deals"
ON public.deals
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update deals"
ON public.deals
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete deals"
ON public.deals
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Sent Emails: Only admins can view
CREATE POLICY "Admins can view sent emails"
ON public.sent_emails
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert sent emails"
ON public.sent_emails
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Price Alerts: Keep for now but restrict to admins
CREATE POLICY "Admins can view price alerts"
ON public.price_alerts
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage price alerts"
ON public.price_alerts
FOR ALL
USING (public.is_admin(auth.uid()));

-- User Roles: Users can view their own role, only admins can manage
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at on subscribers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();