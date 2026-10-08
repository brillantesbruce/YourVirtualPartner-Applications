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
   source in `/admin.html`. Before deploying the session lock, run the
   app-specific SQL migration below in each hosted Supabase project.

## Local build

Run `npm install` at the repository root, then `npm run build`. The root build
copies the static apps and compiles the Vite training sandbox into `dist/`.
Netlify Functions require the server credentials above; never commit local
environment files containing those values.

## Local database and end-to-end testing

Local development uses one local Supabase instance containing all five
assessment tables. This is separate from every hosted Supabase project and
does not copy or modify production data. The schema is created from
`supabase/migrations/`.

1. On Windows, install and start Docker Desktop. Supabase Local requires
   Docker; it cannot start its database containers until Docker is running.
2. From the repository root, start Supabase:

   ```powershell
   npm run db:start
   ```

   The first run downloads the local Supabase services and may take several
   minutes. Apply any pending checked-in migrations to the local database:

   ```powershell
   npm run db:migrate
   ```

   This applies new migrations without deleting existing local test results.
   Use `npm run db:reset` only if you intentionally want to clear local data
   and recreate the database from scratch.
3. Run `npx supabase status -o env` and copy its local `SERVICE_ROLE_KEY` value.
   Replace each `replace-with-local-service-role-key` placeholder in the
   root `.env` with that value. The local URL is
   `http://127.0.0.1:54321`; one local URL and service-role key are shared
   across all five apps. The `.env` file is ignored by Git. Keep its values
   local and never use a production service-role key for local testing.
4. In another terminal, build and start the portal from the repository root:

   ```powershell
   npm run dev
   ```

   This builds the portal and starts Netlify Dev on port 8888. Open
   `http://localhost:8888` for the portal and
   `http://localhost:8888/admin.html` for the admin dashboard. The local admin
   password is set by `ADMIN_PASSWORD` in `.env`. Submit a test in an app and
   verify it appears in the local admin dashboard. The root Netlify config
   explicitly serves the built `dist/` site; it does not start the
   Training Sandbox's standalone Vite development server. Its Node package
   scope stays CommonJS so Netlify's generated function wrappers can load;
   Vite's own config uses the `.mjs` extension to remain an ES module. The
   launcher points Netlify to the shared root functions directory from the
   detected Training Sandbox workspace.
5. When finished, stop the local Supabase services with
   `npm run db:stop`. The local database remains on your computer for next
   time; `npm run db:start` starts it again. Stop the portal with Ctrl+C.

The root `.env.example` contains safe local placeholders. The root `.env` is
the personal working copy and is excluded by `.gitignore`; it should contain
only local URLs and the local Supabase key. These credentials are separate
from the production environment variables configured in Netlify.

## Candidate names and one submission per browser session

Every assessment, including Training Sandbox, requires a candidate name.
Each browser tab session gets a random session ID. Starting an app marks that
app as started in `sessionStorage`; refreshing that tab will not let it start
the same app again. The server also inserts the session ID into the app's
result table, where a unique index prevents a second submission for that app
and browser session. A browser session may still submit once to each separate
app.

This is a session-level guard, not identity verification: opening a new
browser session, using another browser/device, or clearing browser data
creates a different session ID and can permit another attempt. It is not a
substitute for authenticated candidate accounts if attempts must be limited
across sessions or devices.

For each app's hosted Supabase project, run its SQL migration in the Supabase
SQL Editor before deploying:

| App | SQL migration to run |
| --- | --- |
| Broker Support | `apps/broker-support-assessment/supabase/session-lock-migration.sql` |
| Bookkeeper | `apps/bookkeeper-assessment/supabase/session-lock-migration.sql` |
| Training Sandbox | `apps/training-sandbox/supabase/session-lock-migration.sql` |
| FPA | `apps/FPA-assessment/supabase/session-lock-migration.sql` |
| Paraplanner | `apps/Paraplanner-assessment/supabase/session-lock-migration.sql` |

Each migration safely adds and backfills the session ID on existing rows
before making it required and unique. Local Supabase applies the combined
migration in `supabase/migrations/` with `npm run db:migrate`.

The central admin page supports case-insensitive search by candidate name,
app name, or assessment name, across the submissions currently loaded in
the dashboard.

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
outcome, duration, and submitted time. Expand a result to see readable,
app-specific details and answer reviews where the app saves per-question
answers. Training Sandbox stores summary results only, so it has no
field-by-field review. Failed/unconfigured result sources are reported
separately rather than shown as successful empty results.

Exam results screens do not offer an in-app restart or retake button. Because
candidate submissions are anonymous and are not tied to a verified identity,
this is a user-interface restriction only: refreshing or reopening an exam
still permits another submission. Enforcing one attempt per person would
require a reliable candidate identity and a separate access/identity policy.

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
