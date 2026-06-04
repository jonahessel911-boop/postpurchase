-- Track confirmation-page views where offers were shown (for publisher CTR).

create table if not exists public.publisher_offer_impressions (
  id uuid primary key default gen_random_uuid(),
  publisher_id uuid not null references public.publishers(id) on delete cascade,
  placement_id uuid not null references public.publisher_placements(id) on delete cascade,
  offer_count smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists publisher_impressions_publisher_idx
  on public.publisher_offer_impressions (publisher_id, created_at desc);

create index if not exists publisher_impressions_placement_idx
  on public.publisher_offer_impressions (placement_id, created_at desc);

alter table public.publisher_offer_impressions enable row level security;

create policy "Publisher members view own impressions"
  on public.publisher_offer_impressions for select
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = publisher_offer_impressions.publisher_id
        and m.account_type = 'publisher'
        and m.user_id = auth.uid()
    )
  );
