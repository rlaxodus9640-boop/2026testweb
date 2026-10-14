begin;
alter table public.notices
  add column image_paths text[] not null default '{}',
  add column attachments jsonb not null default '[]'::jsonb;

create function public.gakkai_valid_notice_assets(images text[], files jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare item jsonb; image_path text;
begin
  if cardinality(images) > 3 or coalesce(array_ndims(images),1) <> 1 or jsonb_typeof(files) <> 'array' then return false; end if;
  if jsonb_array_length(files) > 5 then return false; end if;
  foreach image_path in array images loop
    if image_path is null or image_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|gif)$' then return false; end if;
  end loop;
  for item in select value from jsonb_array_elements(files) loop
    if jsonb_typeof(item) <> 'object' or not (item ?& array['path','name','size']) then return false; end if;
    if jsonb_typeof(item->'path') <> 'string' or (item->>'path') !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|txt|zip)$' then return false; end if;
    if jsonb_typeof(item->'name') <> 'string' or char_length(item->>'name') not between 1 and 200 then return false; end if;
    if jsonb_typeof(item->'size') <> 'number' then return false; end if;
    if (item->>'size')::numeric <= 0 or (item->>'size')::numeric > 10485760 then return false; end if;
  end loop;
  return true;
end; $$;
alter table public.notices add constraint notices_valid_assets check (public.gakkai_valid_notice_assets(image_paths,attachments));
grant insert (image_paths,attachments), update (image_paths,attachments) on public.notices to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('notice-assets','notice-assets',false,10485760,array['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','application/zip']);

create policy notice_assets_admin_read on storage.objects for select to authenticated
  using (bucket_id='notice-assets' and public.gakkai_is_notice_admin());
create policy notice_assets_member_read on storage.objects for select to authenticated
  using (bucket_id='notice-assets' and exists (
    select 1 from public.notices n where name=any(n.image_paths)
      or n.attachments @> jsonb_build_array(jsonb_build_object('path',name))
  ));
create policy notice_assets_admin_upload on storage.objects for insert to authenticated
  with check (bucket_id='notice-assets' and public.gakkai_is_notice_admin() and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy notice_assets_admin_delete on storage.objects for delete to authenticated
  using (bucket_id='notice-assets' and public.gakkai_is_notice_admin());
commit;
