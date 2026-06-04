-- Publisher payout details + monthly credit invoices (traffic partner earnings).

alter table public.publishers
  add column if not exists invoice_company_name text,
  add column if not exists invoice_email text,
  add column if not exists invoice_vat_number text,
  add column if not exists invoice_address_line1 text,
  add column if not exists invoice_address_line2 text,
  add column if not exists invoice_city text,
  add column if not exists invoice_postal_code text,
  add column if not exists invoice_country text default 'NL',
  add column if not exists bank_account_holder text,
  add column if not exists bank_iban text;

create table if not exists public.credit_invoices (
  id uuid primary key default gen_random_uuid(),
  publisher_id uuid not null references public.publishers(id) on delete cascade,
  invoice_number text not null,
  period_start date not null,
  period_end date not null,
  amount numeric(12, 2) not null,
  clicks_count integer not null default 0,
  status text not null default 'sent'
    check (status in ('draft', 'sent', 'paid', 'overdue')),
  pdf_url text,
  created_at timestamptz default now() not null
);

create index if not exists credit_invoices_publisher_idx
  on public.credit_invoices (publisher_id, created_at desc);

alter table public.credit_invoices enable row level security;

drop policy if exists "Publisher members update publisher" on public.publishers;
create policy "Publisher members update publisher"
  on public.publishers for update
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = publishers.id
        and m.account_type = 'publisher'
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.account_members m
      where m.account_id = publishers.id
        and m.account_type = 'publisher'
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Publishers read own credit invoices" on public.credit_invoices;
create policy "Publishers read own credit invoices"
  on public.credit_invoices for select
  using (
    exists (
      select 1 from public.account_members m
      where m.account_id = credit_invoices.publisher_id
        and m.account_type = 'publisher'
        and m.user_id = auth.uid()
    )
  );
