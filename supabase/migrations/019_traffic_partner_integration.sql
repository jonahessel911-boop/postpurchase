-- One integration per traffic partner (publisher id), not per placement.

alter table public.publishers
  add column if not exists submit_element_id text default 'submit-button';

alter table public.publisher_offer_impressions
  alter column placement_id drop not null;
