alter table public.quiz_attempts
  add column if not exists session_id uuid;
update public.quiz_attempts
set session_id = gen_random_uuid()
where session_id is null;
alter table public.quiz_attempts
  alter column session_id set not null;
create unique index if not exists quiz_attempts_session_id_key
  on public.quiz_attempts (session_id);

alter table public.bookkeeping_assessment_submissions
  add column if not exists session_id uuid;
update public.bookkeeping_assessment_submissions
set session_id = gen_random_uuid()
where session_id is null;
alter table public.bookkeeping_assessment_submissions
  alter column session_id set not null;
create unique index if not exists bookkeeping_assessment_submissions_session_id_key
  on public.bookkeeping_assessment_submissions (session_id);

alter table public.leaderboard_attempts
  add column if not exists session_id uuid;
update public.leaderboard_attempts
set session_id = gen_random_uuid()
where session_id is null;
alter table public.leaderboard_attempts
  alter column session_id set not null;
create unique index if not exists leaderboard_attempts_session_id_key
  on public.leaderboard_attempts (session_id);
alter table public.leaderboard_attempts
  alter column trainee_name drop default;

alter table public.fpa_assessment_submissions
  add column if not exists session_id uuid;
update public.fpa_assessment_submissions
set session_id = gen_random_uuid()
where session_id is null;
alter table public.fpa_assessment_submissions
  alter column session_id set not null;
create unique index if not exists fpa_assessment_submissions_session_id_key
  on public.fpa_assessment_submissions (session_id);

alter table public.paraplanner_assessment_submissions
  add column if not exists session_id uuid;
update public.paraplanner_assessment_submissions
set session_id = gen_random_uuid()
where session_id is null;
alter table public.paraplanner_assessment_submissions
  alter column session_id set not null;
create unique index if not exists paraplanner_assessment_submissions_session_id_key
  on public.paraplanner_assessment_submissions (session_id);
