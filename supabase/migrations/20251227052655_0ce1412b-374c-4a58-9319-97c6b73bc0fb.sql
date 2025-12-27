-- Drop the overly permissive policy that allows anyone to view price alerts
DROP POLICY IF EXISTS "Anyone can view price alerts" ON public.price_alerts;

-- Create policy for users to view only their own price alerts
CREATE POLICY "Users can view own price alerts"
ON public.price_alerts
FOR SELECT
USING (auth.uid() = user_id);