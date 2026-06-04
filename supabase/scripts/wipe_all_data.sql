-- Wipe all advertiser platform data (keeps auth.users and schema).
-- Run in Supabase Dashboard → SQL Editor, or: psql $DATABASE_URL -f supabase/scripts/wipe_all_data.sql

delete from public.conversions;
delete from public.clicks;
delete from public.ads;
delete from public.invoices;
delete from public.campaigns;
delete from public.advertisers;

-- Optional: remove demo auth users too (re-create via /login demo button)
-- delete from auth.users where email in ('demo@demo.nl', 'admin@admin.nl');
