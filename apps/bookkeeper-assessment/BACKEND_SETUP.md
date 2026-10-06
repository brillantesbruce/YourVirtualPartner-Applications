# Bookkeeping assessment deployment

The bookkeeping assessment is deployed from the repository-level Netlify site.
Submission requests go through the central Netlify function and are written to
this app's existing Supabase project. The central `/admin.html` page aggregates
its results with the other apps.

See the repository-level [portal setup](../../PORTAL_SETUP.md) for deployment
and environment-variable instructions. Run this app's
`supabase/schema.sql` in its existing Supabase project before deploying the
updated app so that browser roles cannot read or insert results directly.
