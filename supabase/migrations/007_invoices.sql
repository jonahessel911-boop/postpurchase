-- Business details used on advertiser invoices
alter table public.advertisers
  add column if not exists invoice_company_name text,
  add column if not exists invoice_email text,
  add column if not exists invoice_vat_number text,
  add column if not exists invoice_address_line1 text,
  add column if not exists invoice_address_line2 text,
  add column if not exists invoice_city text,
  add column if not exists invoice_postal_code text,
  add column if not exists invoice_country text default 'NL';

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid references public.advertisers(id) on delete cascade not null,
  invoice_number text not null,
  period_start date not null,
  period_end date not null,
  amount numeric(12, 2) not null,
  status text not null default 'paid'
    check (status in ('draft', 'sent', 'paid', 'overdue')),
  pdf_url text,
  created_at timestamptz default now() not null
);

create index if not exists invoices_advertiser_id_idx
  on public.invoices (advertiser_id, created_at desc);

alter table public.invoices enable row level security;

create policy "Advertisers read own invoices"
  on public.invoices for select
  using (auth.uid() = advertiser_id);
