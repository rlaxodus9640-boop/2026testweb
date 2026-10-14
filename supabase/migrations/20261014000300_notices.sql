begin;

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 20000),
  pinned boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notices_list_order on public.notices (pinned desc, created_at desc, id desc);

-- Check the current DB role, so a stale admin JWT cannot retain write access.
create function public.gakkai_is_notice_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users
    where id = (select auth.uid())
      and raw_app_meta_data ->> 'role' = 'admin'
  );
$$;

revoke all on function public.gakkai_is_notice_admin() from public, anon, authenticated;
grant execute on function public.gakkai_is_notice_admin() to authenticated;

alter table public.notices enable row level security;
revoke all on public.notices from public, anon, authenticated;
grant select on public.notices to anon, authenticated;
grant insert (title, body, pinned, created_by) on public.notices to authenticated;
grant update (title, body, pinned) on public.notices to authenticated;
grant delete on public.notices to authenticated;
grant all on public.notices to service_role;

create policy notices_public_read on public.notices
  for select to anon, authenticated using (true);

create policy notices_admin_insert on public.notices
  for insert to authenticated
  with check (public.gakkai_is_notice_admin() and created_by = (select auth.uid()));

create policy notices_admin_update on public.notices
  for update to authenticated
  using (public.gakkai_is_notice_admin())
  with check (public.gakkai_is_notice_admin());

create policy notices_admin_delete on public.notices
  for delete to authenticated using (public.gakkai_is_notice_admin());

create function public.gakkai_touch_notice()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.gakkai_touch_notice() from public, anon, authenticated;
create trigger gakkai_notice_updated before update on public.notices
  for each row execute function public.gakkai_touch_notice();

commit;
