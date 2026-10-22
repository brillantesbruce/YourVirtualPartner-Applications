alter table public.real_estate_submissions
  add column if not exists session_id uuid;
update public.real_estate_submissions
set session_id = gen_random_uuid()
where session_id is null;
alter table public.real_estate_submissions
  alter column session_id set not null;
create unique index if not exists real_estate_submissions_session_id_key
  on public.real_estate_submissions (session_id);
