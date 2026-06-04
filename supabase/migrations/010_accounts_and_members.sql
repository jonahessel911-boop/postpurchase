-- Company accounts + multi-user membership (advertisers & publishers)

-- Advertiser accounts are no longer 1:1 with auth.users (multi-user per company).
alter table public.advertisers
  drop constraint if exists advertisers_id_fkey;

alter table public.advertisers
  alter column id set default gen_random_uuid();

alter table public.advertisers
  add column if not exists company_name text,
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended'));

update public.advertisers
set company_name = coalesce(
  nullif(trim(company_name), ''),
  nullif(trim(invoice_company_name), ''),
  split_part(email, '@', 2),
  'Advertiser'
)
where company_name is null or trim(company_name) = '';

create table if not exists public.publishers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_email text not null,
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  created_at timestamptz default now() not null
);

create table if not exists public.account_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null,
  account_type text not null check (account_type in ('advertiser', 'publisher')),
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz default now() not null,
  unique (user_id, account_id, account_type)
);

create index if not exists account_members_user_idx
  on public.account_members (user_id, account_type);

create index if not exists account_members_account_idx
  on public.account_members (account_id, account_type);

-- Link existing 1:1 advertiser rows to their auth user
insert into public.account_members (user_id, account_id, account_type, role)
select id, id, 'advertiser', 'owner'
from public.advertisers
on conflict (user_id, account_id, account_type) do nothing;

alter table public.account_members enable row level security;
alter table public.publishers enable row level security;

create policy "Users read own memberships"
  on public.account_members for select
  using (auth.uid() = user_id);

create policy "Publisher members read publisher"
  on public.publishers for select
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = publishers.id
        and m.account_type = 'publisher'
        and m.user_id = auth.uid()
    )
  );

-- Advertiser profile: any member of the account
drop policy if exists "Advertisers can view own profile" on public.advertisers;
create policy "Advertisers can view own profile"
  on public.advertisers for select
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = advertisers.id
        and m.account_type = 'advertiser'
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Advertisers can update own profile" on public.advertisers;
create policy "Advertisers can update own profile"
  on public.advertisers for update
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = advertisers.id
        and m.account_type = 'advertiser'
        and m.user_id = auth.uid()
    )
  );

-- Campaigns: any advertiser account member
drop policy if exists "Advertisers can view own campaigns" on public.campaigns;
create policy "Advertisers can view own campaigns"
  on public.campaigns for select
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = campaigns.advertiser_id
        and m.account_type = 'advertiser'
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Advertisers can insert own campaigns" on public.campaigns;
create policy "Advertisers can insert own campaigns"
  on public.campaigns for insert
  with check (
    exists (
      select 1 from public.account_members m
      where m.account_id = campaigns.advertiser_id
        and m.account_type = 'advertiser'
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Advertisers can update own campaigns" on public.campaigns;
create policy "Advertisers can update own campaigns"
  on public.campaigns for update
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = campaigns.advertiser_id
        and m.account_type = 'advertiser'
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Advertisers can delete own campaigns" on public.campaigns;
create policy "Advertisers can delete own campaigns"
  on public.campaigns for delete
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = campaigns.advertiser_id
        and m.account_type = 'advertiser'
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Advertisers read own invoices" on public.invoices;
create policy "Advertisers read own invoices"
  on public.invoices for select
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = invoices.advertiser_id
        and m.account_type = 'advertiser'
        and m.user_id = auth.uid()
    )
  );

-- Self-signup: keep 1:1 row + owner membership
create or replace function public.ensure_advertiser_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  user_email text;
begin
  if uid is null then
    return;
  end if;

  select email into user_email from auth.users where id = uid;

  insert into public.advertisers (id, email, company_name)
  values (
    uid,
    coalesce(user_email, ''),
    coalesce(split_part(user_email, '@', 2), 'Advertiser')
  )
  on conflict (id) do update
    set email = coalesce(nullif(excluded.email, ''), advertisers.email);

  insert into public.account_members (user_id, account_id, account_type, role)
  values (uid, uid, 'advertiser', 'owner')
  on conflict (user_id, account_id, account_type) do nothing;
end;
$$;
