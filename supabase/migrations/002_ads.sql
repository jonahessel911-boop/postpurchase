-- Ads (creatives within a campaign)
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  name text not null default 'Ad 1',
  active boolean not null default true,
  title text default '',
  subheadline text default '',
  media_url text,
  media_type text not null default 'image'
    check (media_type in ('image', 'video', 'gif')),
  cta_text text default 'Learn more',
  created_at timestamptz default now() not null
);

create index ads_campaign_id_idx on public.ads(campaign_id);

-- Remove creative fields from campaigns (moved to ads)
alter table public.campaigns
  drop column if exists title,
  drop column if exists subheadline,
  drop column if exists media_url,
  drop column if exists media_type,
  drop column if exists cta_text,
  drop column if exists destination_url;

-- Track which ad was clicked
alter table public.clicks
  add column if not exists ad_id uuid references public.ads(id) on delete set null;

create index clicks_ad_id_idx on public.clicks(ad_id);

alter table public.ads enable row level security;

create policy "Advertisers can view ads on own campaigns"
  on public.ads for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = ads.campaign_id and c.advertiser_id = auth.uid()
    )
  );

create policy "Advertisers can insert ads on own campaigns"
  on public.ads for insert
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = ads.campaign_id and c.advertiser_id = auth.uid()
    )
  );

create policy "Advertisers can update ads on own campaigns"
  on public.ads for update
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = ads.campaign_id and c.advertiser_id = auth.uid()
    )
  );

create policy "Advertisers can delete ads on own campaigns"
  on public.ads for delete
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = ads.campaign_id and c.advertiser_id = auth.uid()
    )
  );
