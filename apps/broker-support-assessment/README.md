# YVP quiz backend

Adds result storage and an admin dashboard to the Broker Support Knowledge
Assessment quiz, using Supabase (Postgres) and Netlify Functions.

## What's in this project

- `index.html` - the original quiz, with one addition: after scoring, it
  POSTs the result to `/.netlify/functions/submit-results`.
- `admin.html` - password-protected page for the quiz master to view every
  attempt.
- `netlify/functions/submit-results.js` - public function, writes one row
  per attempt.
- `netlify/functions/get-results.js` - admin-only function (checks a
  password), returns all attempts.
- `supabase-setup.sql` - run this once in Supabase to create the table.
- `netlify.toml`, `package.json` - project/deploy configuration.

## One-time setup

### 1. Create the Supabase project and table
1. Create a free project at supabase.com.
2. Open **SQL Editor > New query**, paste in the contents of
   `supabase-setup.sql`, and run it.
3. Go to **Project Settings > API** and note down:
   - **Project URL** -> this is `SUPABASE_URL`
   - **service_role key** (NOT the `anon` key) -> this is
     `SUPABASE_SERVICE_ROLE_KEY`

The service_role key has full access to your database and must never be
put in `index.html`, `admin.html`, or any file that ships to the browser.
It only ever lives in Netlify's environment variables, read by the two
functions on the server side.

### 2. Deploy to Netlify
1. Push this folder to a GitHub repo (recommended, since it makes updates
   a simple `git push`), then in Netlify: **Add new site > Import an
   existing project** and pick the repo.
   - Alternatively, drag-and-drop this folder in the Netlify dashboard,
     though a Git-connected site is easier to update later.
2. In **Site configuration > Environment variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD` (pick any password for the quiz master)
3. Deploy. Netlify will detect `netlify/functions` automatically and
   install `@supabase/supabase-js` from `package.json` at build time.

### 3. Try it out
- Visit your site's root URL, take the quiz, and submit it. You should
  see "Result saved." under the results buttons.
- Visit `/admin.html`, enter the `ADMIN_PASSWORD` you set, and you should
  see that attempt in the table.

## Notes

- `admin.html` keeps the password only in `sessionStorage` for that
  browser tab, not in a cookie or localStorage, so it clears when the tab
  closes.
- If you ever need to change the pass mark, question bank, or scoring
  logic, only `index.html` changes; the backend just stores whatever
  numbers it's given.
- To query results directly with SQL instead of the admin page (e.g. to
  find everyone who failed Section B), use the Supabase SQL editor:
  ```sql
  select candidate_name, percentage
  from quiz_attempts
  where (section_scores->>'B')::numeric < 6
  order by submitted_at desc;
  ```
