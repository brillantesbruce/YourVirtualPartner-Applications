# YVP apps: one Netlify site, separate Supabase projects

The repository root is the Netlify site. One root build publishes each app at
a stable URL and one central `/admin.html` aggregates results. Each app keeps
its own result table and can use its own Supabase project. Netlify Functions
connect using server-only service-role keys.

## Registered apps and result tables

| App ID | Public URL | Supabase table |
| --- | --- | --- |
| `broker-support-assessment` | `/broker-support-assessment/` | `quiz_attempts` |
| `bookkeeper-assessment` | `/bookkeeper-assessment/` | `bookkeeping_assessment_submissions` |
| `training-sandbox` | `/training-sandbox/` | `leaderboard_attempts` |
| `fpa-assessment` | `/FPA-assessment/` | `fpa_assessment_submissions` |
| `paraplanner-assessment` | `/Paraplanner-assessment/` | `paraplanner_assessment_submissions` |
| Calculators | `/calculators/` | None |

## Before deploying

1. Create or choose the Supabase project for each assessment. Apps may share
   one project if desired, but their Netlify URL/key variables remain
   app-specific. Each app must have its registered table.
2. Run the relevant schema SQL in each project's SQL Editor:
   - Broker Support: `apps/broker-support-assessment/supabase-setup.sql`
   - Bookkeeper: `apps/bookkeeper-assessment/supabase/schema.sql`
   - Training Sandbox: `apps/training-sandbox/supabase/schema.sql`
   - FPA: `apps/FPA-assessment/supabase/schema.sql`
   - Paraplanner: `apps/Paraplanner-assessment/supabase/schema.sql`

   The Bookkeeper and Training schemas remove browser-role access. The FPA and
   Paraplanner schemas create private tables with RLS enabled and revoke
   `anon`/`authenticated` access. Candidate submissions and admin reads go
   through the Netlify functions.
3. Create/select one Netlify site connected to this repository, with the
   **base directory set to the repository root**. The root `netlify.toml`
   builds the portal and deploys `netlify/functions`.
4. Add these environment variables to Netlify:

   | Variable | Value |
   | --- | --- |
   | `ADMIN_PASSWORD` | A long, unique admin password |
   | `BROKER_SUPPORT_SUPABASE_URL` | Broker Support Supabase project URL |
   | `BROKER_SUPPORT_SUPABASE_SERVICE_ROLE_KEY` | Broker Support service-role key |
   | `BOOKKEEPER_SUPABASE_URL` | Bookkeeper Supabase project URL |
   | `BOOKKEEPER_SUPABASE_SERVICE_ROLE_KEY` | Bookkeeper service-role key |
   | `TRAINING_SANDBOX_SUPABASE_URL` | Training Sandbox Supabase project URL |
   | `TRAINING_SANDBOX_SUPABASE_SERVICE_ROLE_KEY` | Training Sandbox service-role key |
   | `FPA_ASSESSMENT_SUPABASE_URL` | FPA Supabase project URL |
   | `FPA_ASSESSMENT_SUPABASE_SERVICE_ROLE_KEY` | FPA service-role key |
   | `PARAPLANNER_ASSESSMENT_SUPABASE_URL` | Paraplanner Supabase project URL |
   | `PARAPLANNER_ASSESSMENT_SUPABASE_SERVICE_ROLE_KEY` | Paraplanner service-role key |

   URLs are not secrets; service-role keys and `ADMIN_PASSWORD` must be
   configured as secrets. If apps share a Supabase project, repeating that
   project's matching URL and service-role key in the corresponding variables
   is supported. Never place service-role keys in browser code, `VITE_`
   variables, or committed files.
5. Deploy. The public landing page links to the apps. The admin dashboard is
   available at `/admin.html` and is not linked publicly.
6. Submit a test result in each app and verify it appears under the correct
   source in `/admin.html`.

## Local build

Run `npm install` at the repository root, then `npm run build`. The root build
copies the static apps and compiles the Vite training sandbox into `dist/`.
Netlify Functions require the server credentials above; never commit local
environment files containing those values.

## The app integration template

For each new assessment:

1. Add `apps/<app-id>/index.html` and its SQL schema at
   `apps/<app-id>/supabase/schema.sql`. The schema should enable RLS and avoid
   browser read/write policies when submissions are routed through Netlify.
2. Have the assessment POST a `{ app_id, result }` envelope to
   `/.netlify/functions/submit-result`. Do not put Supabase credentials in the
   app HTML.
3. Add the app's table, environment variable names, and a normalizer to
   `netlify/functions/app-registry.js`.
4. Add strict field and bounds validation keyed by app ID to
   `netlify/functions/submit-result.js`.
5. Add the app route to `scripts/build.js` and the landing page. Add that
   app's project URL and service-role key variables to Netlify.
6. Update this table and the environment-variable list, run its schema, build
   the site, then test submission and admin viewing.

The shared admin fields are candidate, app, assessment, score, percentage,
outcome, duration, and submitted time. Each app can include its own result
details, displayed in the expandable details row. Failed/unconfigured result
sources are reported separately rather than shown as successful empty results.

## Security and operational notes

- The admin results function checks `ADMIN_PASSWORD` server-side and uses
  server-only service-role keys to read the registered tables.
- Candidate submissions are anonymous. Server validation checks shape and
  bounds, but scores can still be forged by changing browser requests. Treat
  these as interview/training records, not tamper-proof certification.
- Keep the former app-specific Netlify sites until the central deployment is
  verified. The root site publishes its own `dist` paths and does not serve
  the legacy app-level Netlify Functions.
- Netlify environment-variable changes require a new deploy for Functions.
