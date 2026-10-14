begin;

-- The designated existing account must own a verified email address.
-- Replace admin@example.com with the real administrator email before applying.
-- Abort rather than silently claiming that administrator assignment succeeded.
do $$
begin
  if not exists (
    select 1 from auth.users
    where lower(email) = 'admin@example.com'
      and email_confirmed_at is not null
  ) then
    raise exception 'The designated administrator account must exist and have a confirmed email before this migration is applied.';
  end if;
end;
$$;

-- Preserve unrelated provider metadata and existing valid administrative roles.
update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', '"user"'::jsonb
)
where coalesce(raw_app_meta_data ->> 'role', '') not in ('admin', 'user');

update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"'::jsonb
)
where lower(email) = 'admin@example.com'
  and email_confirmed_at is not null;

-- Default new accounts to user. Signup user_metadata cannot influence this role.
create function public.gakkai_default_account_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(new.raw_app_meta_data ->> 'role', '') not in ('admin', 'user') then
    new.raw_app_meta_data := jsonb_set(
      coalesce(new.raw_app_meta_data, '{}'::jsonb), '{role}', '"user"'::jsonb
    );
  end if;
  return new;
end;
$$;

revoke all on function public.gakkai_default_account_role() from public, anon, authenticated;

create trigger gakkai_default_account_role
  before insert on auth.users
  for each row execute function public.gakkai_default_account_role();

commit;
