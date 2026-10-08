alter table public.fpa_assessment_submissions add column if not exists session_id uuid;
update public.fpa_assessment_submissions set session_id = gen_random_uuid() where session_id is null;
alter table public.fpa_assessment_submissions alter column session_id set not null;
create unique index if not exists fpa_assessment_submissions_session_id_key
  on public.fpa_assessment_submissions (session_id);
