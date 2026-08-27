// netlify/functions/get-results.js
//
// Admin-only endpoint. Requires the admin password to be sent in the
// 'x-admin-password' header. Returns every quiz attempt, most recent first.
//
// Required environment variables (set in Netlify site settings):
//   SUPABASE_URL              - your Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY - the service_role key (NOT the anon key)
//   ADMIN_PASSWORD            - the password the quiz master types into admin.html

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const suppliedPassword = event.headers['x-admin-password'] || event.headers['X-Admin-Password'];
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('Missing ADMIN_PASSWORD env var');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  if (!suppliedPassword || suppliedPassword !== adminPassword) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Supabase select error', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not fetch results' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attempts: data })
  };
};
