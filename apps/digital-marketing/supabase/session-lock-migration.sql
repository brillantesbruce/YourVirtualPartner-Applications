alter table public.digital_marketing_submissions
  add column if not exists session_id uuid;
update public.digital_marketing_submissions
set session_id = gen_random_uuid()
where session_id is null;
alter table public.digital_marketing_submissions
  alter column session_id set not null;
create unique index if not exists digital_marketing_submissions_session_id_key
  on public.digital_marketing_submissions (session_id);
