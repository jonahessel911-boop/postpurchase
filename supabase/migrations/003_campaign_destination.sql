-- Destination URL is shared across all ads in a campaign
alter table public.campaigns
  add column if not exists destination_url text default '';

alter table public.ads
  drop column if exists destination_url;
