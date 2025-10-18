-- Create email_queue table for reliable email delivery
CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email_type text NOT NULL, -- 'welcome', 'price_alert', 'digest', 'onboarding_reminder', 'reengagement'
  email_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  scheduled_for timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage email queue" 
ON public.email_queue 
FOR ALL 
USING (is_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON public.email_queue(scheduled_for);
CREATE INDEX idx_email_queue_user ON public.email_queue(user_id);

-- Create user_preferences table for email settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email_notifications_enabled boolean NOT NULL DEFAULT true,
  email_frequency text NOT NULL DEFAULT 'instant', -- 'instant', 'daily', 'weekly'
  last_login_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage preferences" 
ON public.user_preferences 
FOR ALL 
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to queue an email
CREATE OR REPLACE FUNCTION public.queue_email(
  p_user_id uuid,
  p_email_type text,
  p_email_data jsonb,
  p_scheduled_for timestamp with time zone DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_id uuid;
  v_email_enabled boolean;
BEGIN
  -- Check if user has email notifications enabled
  SELECT email_notifications_enabled INTO v_email_enabled
  FROM public.user_preferences
  WHERE user_id = p_user_id;

  -- If no preferences exist, create default ones
  IF NOT FOUND THEN
    INSERT INTO public.user_preferences (user_id)
    VALUES (p_user_id);
    v_email_enabled := true;
  END IF;

  -- Only queue if email notifications are enabled (except for verification emails)
  IF v_email_enabled OR p_email_type = 'verification' THEN
    INSERT INTO public.email_queue (user_id, email_type, email_data, scheduled_for)
    VALUES (p_user_id, p_email_type, p_email_data, p_scheduled_for)
    RETURNING id INTO v_email_id;
    
    RETURN v_email_id;
  END IF;

  RETURN NULL;
END;
$$;