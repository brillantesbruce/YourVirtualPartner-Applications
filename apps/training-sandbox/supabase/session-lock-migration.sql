alter table public.leaderboard_attempts add column if not exists session_id uuid;
update public.leaderboard_attempts set session_id = gen_random_uuid() where session_id is null;
alter table public.leaderboard_attempts alter column session_id set not null;
create unique index if not exists leaderboard_attempts_session_id_key
  on public.leaderboard_attempts (session_id);
alter table public.leaderboard_attempts alter column trainee_name drop default;
