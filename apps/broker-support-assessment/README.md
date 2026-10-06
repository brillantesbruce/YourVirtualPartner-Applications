# Broker Support Assessment

This app is deployed as part of the repository-wide Netlify site. Completed
results are written through the shared Netlify submission function to the
app's existing Supabase project. The central `/admin.html` page aggregates
those results with the other apps.

See the repository-level [portal setup](../../PORTAL_SETUP.md) for build,
deployment, environment-variable, and admin access instructions. The table
schema is in `supabase-setup.sql`; it keeps Row Level Security enabled without
browser-role read or write policies.
