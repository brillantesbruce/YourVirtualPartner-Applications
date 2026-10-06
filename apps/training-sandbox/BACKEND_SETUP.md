# Shared practice results and admin page

The training sandbox is hosted on Netlify, with Supabase storing submitted
attempts. The main app no longer displays results. Use `/admin.html` to reach
the separate password-protected admin page.

## Supabase setup

1. Open the Supabase project used by this app.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL
   Editor. It removes the old public leaderboard read policy and keeps
   anonymous inserts enabled.
3. Confirm the `leaderboard_attempts` table exists.

The public app can submit attempts, but it cannot read the table. Results are
read by the Netlify function using a server-only service-role key.

## Netlify setup

Set the site's base directory to `apps/training-sandbox`. Netlify uses
`netlify.toml` to build with `npm run build`, publish `dist`, and deploy the
function in `netlify/functions`.

Add these variables under **Site configuration > Environment variables**:

| Variable | Used by | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Frontend build | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend build | Publishable/anon key; browser-visible |
| `SUPABASE_URL` | Netlify function | Same Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify function | Secret; never put in frontend code |
| `ADMIN_PASSWORD` | Netlify function | Strong password for `/admin.html` |

Use a long, unique admin password. Do not add `SUPABASE_SERVICE_ROLE_KEY` or
`ADMIN_PASSWORD` to `.env.example`, frontend code, or any `VITE_` variable.
After setting the variables, trigger a new Netlify deploy.

## Checking the setup

1. Visit the normal app and submit a practice attempt.
2. Open `/admin.html`, enter the `ADMIN_PASSWORD`, and confirm the attempt
   appears.
3. The admin page is intentionally not linked from the main app. Knowing its
   URL alone does not grant access; every results request is checked by the
   Netlify function.

The password gate protects reading results. Anonymous submissions can still
be forged by someone modifying browser requests, so treat scores as
low-stakes training records rather than verified assessments.
