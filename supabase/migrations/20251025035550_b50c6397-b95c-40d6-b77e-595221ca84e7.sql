-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Unschedule any existing check-flight-prices jobs
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname LIKE 'check-flight-prices%';

-- Schedule the check-flight-prices function to run every hour (at minute 0)
SELECT cron.schedule(
  'check-flight-prices-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://nlrdiznleytpuwvugloi.supabase.co/functions/v1/check-flight-prices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scmRpem5sZXl0cHV3dnVnbG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzQzOTUsImV4cCI6MjA3NTM1MDM5NX0.H69iAvi4PyvauoOOD4wLinEhiNUTEkO3jmwL-aEAFF8"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule the process-email-queue function to run every 5 minutes
SELECT cron.schedule(
  'process-email-queue-5min',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://nlrdiznleytpuwvugloi.supabase.co/functions/v1/process-email-queue',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scmRpem5sZXl0cHV3dnVnbG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzQzOTUsImV4cCI6MjA3NTM1MDM5NX0.H69iAvi4PyvauoOOD4wLinEhiNUTEkO3jmwL-aEAFF8"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);