-- Skip advertiser profile for platform admin demo account
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if lower(new.email) = 'admin@admin.nl' then
    return new;
  end if;

  insert into public.advertisers (id, email)
  values (new.id, new.email);
  return new;
end;
$$;
