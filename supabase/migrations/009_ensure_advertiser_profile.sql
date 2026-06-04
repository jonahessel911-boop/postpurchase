-- Allow authenticated users to create their own advertiser row (fallback if auth trigger missed).
create policy "Advertisers can insert own profile"
  on public.advertisers for insert
  to authenticated
  with check (auth.uid() = id);

-- Idempotent profile creation callable from the app after signup.
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

  insert into public.advertisers (id, email)
  values (uid, coalesce(user_email, ''))
  on conflict (id) do update
    set email = coalesce(nullif(excluded.email, ''), advertisers.email);
end;
$$;

grant execute on function public.ensure_advertiser_profile() to authenticated;
