-- Create admin_audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  affected_table TEXT,
  affected_record_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Create index for better query performance
CREATE INDEX idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- Create admin_settings table for system configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage settings"
  ON public.admin_settings FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES
  ('free_plan_destination_limit', '10', 'Maximum destinations for free plan users'),
  ('price_check_frequency_hours', '24', 'How often to check prices (in hours)'),
  ('alert_cooldown_days', '7', 'Days to wait between alerts for same destination'),
  ('signups_enabled', 'true', 'Whether new user signups are enabled'),
  ('maintenance_mode', 'false', 'Enable maintenance mode'),
  ('pro_plan_enabled', 'false', 'Enable Pro plan features')
ON CONFLICT (setting_key) DO NOTHING;