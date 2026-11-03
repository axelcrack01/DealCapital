-- Supabase Cron schedules safe cleanup hourly.
-- The function checks a 7-day deadline, foreign-key relations, prior audit,
-- and media references. It will not remove any existing project that has not
-- explicitly been rejected through dc_admin_reject_project.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
SELECT cron.schedule(
 'dealcapital-rejected-proposal-purge-hourly',
 '0 * * * *',
 'SELECT dealcapital_private.dc_purge_rejected_projects(25);'
);
