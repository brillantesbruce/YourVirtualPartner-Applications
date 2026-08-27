-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)

create table quiz_attempts (
  id              uuid primary key default gen_random_uuid(),
  candidate_name  text not null,
  candidate_role  text,
  total_score     numeric not null,
  total_marks     numeric not null,
  percentage      numeric not null,
  passed          boolean not null,
  elapsed_seconds numeric,
  section_scores  jsonb,
  answers         jsonb,
  submitted_at    timestamptz not null default now()
);

create index idx_quiz_attempts_submitted_at on quiz_attempts (submitted_at desc);
create index idx_quiz_attempts_candidate_name on quiz_attempts (candidate_name);

-- Row Level Security stays ON by default in Supabase with no policies,
-- which means only the service_role key (used by the Netlify Functions)
-- can read or write this table. The anon/public key gets nothing.
-- That's exactly what we want here, so no policies need to be added.
alter table quiz_attempts enable row level security;
