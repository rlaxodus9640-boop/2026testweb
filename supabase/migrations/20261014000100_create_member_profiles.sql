begin;

-- Email, password hashes and sessions belong to Supabase Auth.
-- Never store passwords or password confirmation in public tables.
create table public.member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  demo_notice_acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_profiles_name_length check (
    full_name is null or (
      full_name = btrim(full_name) and char_length(full_name) between 1 and 50
    )
  )
);

comment on table public.member_profiles is
  'Application profile linked to Supabase Auth. No credentials are stored here.';
comment on column public.member_profiles.demo_notice_acknowledged_at is
  'Demo notice acknowledgement only; not production terms or privacy consent.';

alter table public.member_profiles enable row level security;
revoke all on public.member_profiles from public, anon, authenticated;
grant select on public.member_profiles to authenticated;
grant update (full_name) on public.member_profiles to authenticated;
grant all on public.member_profiles to service_role;

create policy member_profiles_select_own
  on public.member_profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy member_profiles_update_own
  on public.member_profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.gakkai_create_member_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.member_profiles (id, full_name, demo_notice_acknowledged_at)
  values (
    new.id,
    nullif(left(btrim(new.raw_user_meta_data ->> 'full_name'), 50), ''),
    case when new.raw_user_meta_data -> 'demo_notice_acknowledged' = 'true'::jsonb
      then now() else null end
  );
  return new;
end;
$$;

revoke all on function public.gakkai_create_member_profile() from public, anon, authenticated;

create trigger gakkai_auth_user_created
  after insert on auth.users
  for each row execute function public.gakkai_create_member_profile();

create function public.gakkai_touch_member_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.gakkai_touch_member_profile() from public, anon, authenticated;

create trigger gakkai_member_profile_updated
  before update on public.member_profiles
  for each row execute function public.gakkai_touch_member_profile();

-- Preserve existing Auth accounts; do not invent acknowledgement for them.
insert into public.member_profiles (id, full_name)
select id, nullif(left(btrim(raw_user_meta_data ->> 'full_name'), 50), '')
from auth.users;

commit;
