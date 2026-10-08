alter table public.quiz_attempts add column if not exists session_id uuid;
update public.quiz_attempts set session_id = gen_random_uuid() where session_id is null;
alter table public.quiz_attempts alter column session_id set not null;
create unique index if not exists quiz_attempts_session_id_key on public.quiz_attempts (session_id);
