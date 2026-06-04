-- Advertisers (linked to auth.users)
create table public.advertisers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  wallet_balance numeric(12, 2) default 0 not null,
  api_key text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz default now() not null
);

-- Campaigns
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid references public.advertisers(id) on delete cascade not null,
  name text not null default 'Untitled Campaign',
  vertical text not null default 'other'
    check (vertical in ('energy', 'home_improvement', 'finance', 'insurance', 'other')),
  cpc_bid numeric(10, 4) not null default 0.50,
  daily_budget numeric(12, 2),
  total_budget numeric(12, 2),
  start_date date,
  end_date date,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  on_off boolean not null default false,
  title text default '',
  subheadline text default '',
  media_url text,
  media_type text not null default 'image'
    check (media_type in ('image', 'video', 'gif')),
  cta_text text default 'Learn more',
  destination_url text default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Clicks
create table public.clicks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  click_id text unique not null,
  cost numeric(10, 4) not null,
  created_at timestamptz default now() not null
);

create index clicks_campaign_id_idx on public.clicks(campaign_id);
create index clicks_created_at_idx on public.clicks(created_at);

-- Conversions (dedupe via unique click_id)
create table public.conversions (
  id uuid primary key default gen_random_uuid(),
  click_id text unique not null references public.clicks(click_id),
  value numeric(12, 2) default 0,
  event text not null,
  created_at timestamptz default now() not null
);

-- Auto-create advertiser on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.advertisers (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.update_updated_at();

-- RLS
alter table public.advertisers enable row level security;
alter table public.campaigns enable row level security;
alter table public.clicks enable row level security;
alter table public.conversions enable row level security;

create policy "Advertisers can view own profile"
  on public.advertisers for select
  using (auth.uid() = id);

create policy "Advertisers can update own profile"
  on public.advertisers for update
  using (auth.uid() = id);

create policy "Advertisers can view own campaigns"
  on public.campaigns for select
  using (auth.uid() = advertiser_id);

create policy "Advertisers can insert own campaigns"
  on public.campaigns for insert
  with check (auth.uid() = advertiser_id);

create policy "Advertisers can update own campaigns"
  on public.campaigns for update
  using (auth.uid() = advertiser_id);

create policy "Advertisers can delete own campaigns"
  on public.campaigns for delete
  using (auth.uid() = advertiser_id);

create policy "Advertisers can view clicks on own campaigns"
  on public.clicks for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = clicks.campaign_id and c.advertiser_id = auth.uid()
    )
  );

create policy "Advertisers can view conversions on own clicks"
  on public.conversions for select
  using (
    exists (
      select 1 from public.clicks cl
      join public.campaigns c on c.id = cl.campaign_id
      where cl.click_id = conversions.click_id and c.advertiser_id = auth.uid()
    )
  );

-- Storage bucket for campaign media
insert into storage.buckets (id, name, public)
values ('campaign-media', 'campaign-media', true)
on conflict (id) do nothing;

create policy "Advertisers can upload campaign media"
  on storage.objects for insert
  with check (
    bucket_id = 'campaign-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view campaign media"
  on storage.objects for select
  using (bucket_id = 'campaign-media');

create policy "Advertisers can update own media"
  on storage.objects for update
  using (
    bucket_id = 'campaign-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Advertisers can delete own media"
  on storage.objects for delete
  using (
    bucket_id = 'campaign-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
