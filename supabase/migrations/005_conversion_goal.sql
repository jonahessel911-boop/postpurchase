alter table public.campaigns
  add column if not exists conversion_goal text not null default 'lead'
  check (conversion_goal in ('purchase', 'lead', 'signup', 'subscribe', 'custom'));
