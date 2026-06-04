-- Offer display types: redirect (full page), popup, native (card on thank-you page).

update public.publisher_placements
set placement = 'native'
where placement = 'in_page';

update public.clicks
set placement = 'native'
where placement = 'in_page';

alter table public.publisher_placements
  drop constraint if exists publisher_placements_placement_check;

alter table public.publisher_placements
  add constraint publisher_placements_placement_check
  check (placement in ('redirect', 'popup', 'native'));

alter table public.clicks
  drop constraint if exists clicks_placement_check;

alter table public.clicks
  add constraint clicks_placement_check
  check (placement is null or placement in ('redirect', 'popup', 'native'));

-- Publishers can read clicks attributed to their account
create policy "Publisher members view own clicks"
  on public.clicks for select
  using (
    publisher_id is not null
    and exists (
      select 1 from public.account_members m
      where m.account_id = clicks.publisher_id
        and m.account_type = 'publisher'
        and m.user_id = auth.uid()
    )
  );
