-- Publisher confirmation-page placements (widget config per thank-you page).

create table if not exists public.publisher_placements (
  id uuid primary key default gen_random_uuid(),
  publisher_id uuid not null references public.publishers(id) on delete cascade,
  name text not null,
  site_url text not null default '',
  page_path text not null default '/confirmation',
  intent_product text not null default '',
  placement text not null default 'native'
    check (placement in ('popup', 'native', 'in_page')),
  geo_country text,
  max_offers smallint not null default 3 check (max_offers between 1 and 12),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists publisher_placements_publisher_idx
  on public.publisher_placements (publisher_id);

create trigger publisher_placements_updated_at
  before update on public.publisher_placements
  for each row execute function public.update_updated_at();

alter table public.publisher_placements enable row level security;

create policy "Publisher members manage placements"
  on public.publisher_placements for all
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = publisher_placements.publisher_id
        and m.account_type = 'publisher'
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.account_members m
      where m.account_id = publisher_placements.publisher_id
        and m.account_type = 'publisher'
        and m.user_id = auth.uid()
    )
  );

-- Public read of active placements (widget embed uses placement id only).
create policy "Anyone can read active placements"
  on public.publisher_placements for select
  using (active = true);
