-- Draft ads stay out of the live ads list until published.
alter table public.ads
  add column if not exists is_draft boolean not null default false;

create index if not exists ads_campaign_draft_idx
  on public.ads (campaign_id, is_draft);
