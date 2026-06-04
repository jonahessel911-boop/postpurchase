-- Rich click attribution (recoverable from click_id).

alter table public.clicks
  add column if not exists publisher_id uuid references public.publishers(id) on delete set null,
  add column if not exists widget_url text,
  add column if not exists page text,
  add column if not exists intent_product text,
  add column if not exists product_choose text,
  add column if not exists product_selection jsonb,
  add column if not exists geo_country text,
  add column if not exists placement text
    check (placement is null or placement in ('popup', 'native', 'in_page'));

create index if not exists clicks_click_id_idx on public.clicks (click_id);
create index if not exists clicks_publisher_id_idx on public.clicks (publisher_id);
create index if not exists clicks_geo_country_idx on public.clicks (geo_country);
