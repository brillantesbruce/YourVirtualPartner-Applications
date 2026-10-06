# YVP apps: one Netlify site, separate Supabase projects

The repository root is the Netlify site. The site publishes the apps at
stable paths and serves one central results page at `/admin.html`. Each app
keeps its existing Supabase project and results table; root Netlify Functions
connect to those projects using server-only credentials.

## Before the first deployment

1. Confirm all three Supabase projects and existing tables are available:
   - Broker Support Assessment: `quiz_attempts`
   - Bookkeeping Technical Assessment: `bookkeeping_assessment_submissions`
   - Training Sandbox: `leaderboard_attempts`
2. Run the updated `apps/bookkeeper-assessment/supabase/schema.sql` and
   `apps/training-sandbox/supabase/schema.sql` in their respective projects.
   These remove browser-role table access because submissions will now be
   written through Netlify Functions. The broker table already has RLS enabled
   without public policies.
3. In Netlify, create or select one site connected to this repository. Set the
   **base directory to the repository root**. The root `netlify.toml` builds
   the static apps and deploys the central functions.
4. Set these environment variables for the Netlify site:

   | Variable | Value |
   | --- | --- |
   | `ADMIN_PASSWORD` | A long, unique admin password |
   | `BROKER_SUPPORT_SUPABASE_URL` | Broker Support project's URL |
   | `BROKER_SUPPORT_SUPABASE_SERVICE_ROLE_KEY` | Broker Support service-role key |
   | `BOOKKEEPER_SUPABASE_URL` | Bookkeeper project's URL |
   | `BOOKKEEPER_SUPABASE_SERVICE_ROLE_KEY` | Bookkeeper service-role key |
   | `TRAINING_SANDBOX_SUPABASE_URL` | Training Sandbox project's URL |
   | `TRAINING_SANDBOX_SUPABASE_SERVICE_ROLE_KEY` | Training Sandbox service-role key |

   Service-role keys must stay in Netlify environment settings. Never add them
   to source files, `VITE_` variables, or a committed `.env` file. Each app's
   project URL/key pair may point to its own independent project.
5. Deploy. The home page links to the apps; the central admin page is available
   at `/admin.html` and is intentionally not linked publicly.
6. Submit a test result for each app and verify its card and result appear in
   `/admin.html`.

## Local build

Run `npm install` at the repository root and then `npm run build`. The root
workspace install also installs the Vite app's dependencies. The root build
copies static app files and builds the training app under `dist/`.

Local Netlify Function testing also requires the seven environment variables
above. Use a local, untracked `.env` file only if you are comfortable managing
those credentials securely. Never commit local environment files.

## Adding an app later

1. Add its source app under `apps/<app-id>/` and give it a stable route.
2. Add an entry and a row normalizer in `netlify/functions/app-registry.js`.
3. Add strict submission validation in `netlify/functions/submit-result.js`.
4. Include its database source in `netlify/functions/get-results.js` through
   the registry, add its two server environment variables to Netlify, and add
   it to the public landing page.
5. Add its build/copy step in `scripts/build.js`.

The central page normalizes shared fields (candidate, app, score, date and
duration) while keeping app-specific answer data in expandable details.
Failed/unconfigured databases are identified separately; their records are
not silently represented as empty successful results.

## Security and operational notes

- The results endpoint checks `ADMIN_PASSWORD` server-side and only uses
  server-side service-role keys after that check.
- Candidate submissions are anonymous and can be forged by a person who
  modifies browser requests. Treat scores as training/interview records, not
  tamper-proof certification.
- A single Netlify site and deployment now serves the app paths. Keep the old
  app-level deployment files until the central deployment has been verified;
  they are not included in the root publish output.
- Netlify environment-variable updates require a new deployment for build-time
  values and function configuration.
