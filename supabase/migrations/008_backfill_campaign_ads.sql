-- Backfill one default ad for campaigns that have no ads (e.g. created before ads sync)
insert into public.ads (
  campaign_id,
  name,
  active,
  title,
  subheadline,
  media_type,
  cta_text
)
select
  c.id,
  'Ad 1',
  true,
  coalesce(nullif(trim(c.name), ''), 'Untitled campaign'),
  '',
  'image',
  'Learn more'
from public.campaigns c
where not exists (
  select 1 from public.ads a where a.campaign_id = c.id
);
