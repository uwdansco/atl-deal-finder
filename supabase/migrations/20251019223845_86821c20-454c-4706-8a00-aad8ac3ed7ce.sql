-- Update the flight price check cron job to run every 2 hours instead of 6
SELECT cron.unschedule('check-flight-prices-job');

SELECT cron.schedule(
  'check-flight-prices-job',
  '0 */2 * * *', -- Every 2 hours at the top of the hour
  $$
  SELECT
    net.http_post(
      url:='https://nlrdiznleytpuwvugloi.supabase.co/functions/v1/check-flight-prices',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scmRpem5sZXl0cHV3dnVnbG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzQzOTUsImV4cCI6MjA3NTM1MDM5NX0.H69iAvi4PyvauoOOD4wLinEhiNUTEkO3jmwL-aEAFF8"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);