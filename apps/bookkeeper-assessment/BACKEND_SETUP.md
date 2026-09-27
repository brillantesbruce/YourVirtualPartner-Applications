# Bookkeeping assessment backend

The assessment remains a static HTML file hosted on Netlify. Supabase stores
completed submissions in PostgreSQL. Candidates do not create accounts and
there is no public results or leaderboard page.

## Supabase setup

1. Create a Supabase project on the free tier.
2. Open **SQL Editor** and run
   [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy the project URL and publishable anon key from **Project Settings >
   API**.
4. Open `Bookkeeping-Technical-Assessment.html` and replace the two placeholder
   values near the top of the script:

   ```js
   var SUPABASE_URL = "https://your-project.supabase.co";
   var SUPABASE_ANON_KEY = "your-publishable-anon-key";
   ```

   The anon key is intended for browser use. Never put a service-role key in
   this file.
5. Deploy the HTML file to Netlify.
6. Review submissions in Supabase **Table Editor** under
   `bookkeeping_assessment_submissions`.

## What is stored

Each completed assessment stores the candidate name entered on the start
screen, the score, score band, selected answer indexes, time used per
question, and submission timestamp. The question text and correct answers are
not submitted.

## Security boundary

The table permits anonymous inserts but does not permit anonymous reads. This
keeps results out of the candidate-facing app, but anonymous candidates can
still technically forge a submission using browser developer tools. Treat
these as interview records rather than tamper-proof examination results. If
strong verification is needed later, add an interviewer-issued assessment
token or authenticated candidate flow.
