-- Integration fields: redirect URL, popup submit button id.

alter table public.publisher_placements
  add column if not exists submit_element_id text,
  add column if not exists post_submit_redirect_url text;

comment on column public.publisher_placements.submit_element_id is
  'DOM id of the publisher submit button (popup placements).';
comment on column public.publisher_placements.post_submit_redirect_url is
  'Full URL to send users after form submit (redirect placements).';
