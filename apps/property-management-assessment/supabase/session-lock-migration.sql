alter table public.property_management_submissions
  add column if not exists session_id uuid;
update public.property_management_submissions
set session_id = gen_random_uuid()
where session_id is null;
alter table public.property_management_submissions
  alter column session_id set not null;
create unique index if not exists property_management_submissions_session_id_key
  on public.property_management_submissions (session_id);
