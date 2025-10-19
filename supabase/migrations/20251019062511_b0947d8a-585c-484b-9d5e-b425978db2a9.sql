-- Add cron jobs for automated price checking and email processing
-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule price checks every 6 hours (at 00:00, 06:00, 12:00, 18:00)
SELECT cron.schedule(
  'check-flight-prices-every-6h',
  '0 */6 * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://nlrdiznleytpuwvugloi.supabase.co/functions/v1/check-flight-prices',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule email queue processing every 15 minutes
SELECT cron.schedule(
  'process-email-queue-every-15min',
  '*/15 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://nlrdiznleytpuwvugloi.supabase.co/functions/v1/process-email-queue',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);