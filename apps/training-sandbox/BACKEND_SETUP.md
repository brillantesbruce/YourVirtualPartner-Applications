# Shared leaderboard backend

The app is still hosted as a static Vite build on Netlify. Supabase provides
the Postgres database and browser-accessible API; no custom server is required
for the current anonymous leaderboard.

## Supabase setup

1. Create a Supabase project on the free tier.
2. Open **SQL Editor**, run [`supabase/schema.sql`](./supabase/schema.sql), and
   confirm the table and policies were created.
3. In **Project Settings > API**, copy the project URL and the publishable
   anon key. Never use a service-role key in this frontend.
4. Copy `.env.example` to `.env.local` and fill in
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Start the app with `npm run dev`, submit an attempt, and confirm it appears
   in the shared leaderboard.

## Netlify setup

Add the same two variables under **Site configuration > Environment variables**
for the deploy context, then trigger a new deploy. Netlify continues to run
`npm run build` and publish `dist` as configured in `netlify.toml`.

## Current security boundary

Only the display name, case identifier/title, score, time, and submission time
are stored. The completed application form and source case documents are not
sent to Supabase. Because submissions are anonymous, users can still submit
fake names or scores; this leaderboard is not an authoritative assessment
record. Add Supabase Auth and user-scoped Row Level Security before storing
official trainee progress or sensitive broker/client data.
