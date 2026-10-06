# Training sandbox deployment

The training sandbox is built and deployed as part of the repository-wide
Netlify site. Its result submissions are sent to the central Netlify function,
which stores them in this app's existing Supabase project.

See the repository-level [portal setup](../../PORTAL_SETUP.md) for Netlify
configuration, database credentials, admin results access, and the build
process. Run this app's `supabase/schema.sql` in its existing project before
the unified deployment so browser roles no longer have direct table access.
