-- Programación de automatizaciones y campañas programadas (opcional).
-- Ejecutar una sola vez en el SQL Editor de Supabase, después de desplegar las
-- Edge Functions. Reemplaza <PROJECT_REF> y <CRON_SECRET> por tus valores;
-- no guardes este archivo con el secreto real dentro del repositorio.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'dulce-momento-automatizaciones',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/run-automations',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{}'::jsonb
  );
  $$
);
