// netlify/functions/submit-results.js
//
// Public endpoint. Any quiz taker's browser calls this right after the
// quiz is scored, to save their attempt into Supabase.
//
// Required environment variables (set in Netlify site settings):
//   SUPABASE_URL              - your Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY - the service_role key (NOT the anon key)
//
// The service_role key is only ever read here, on the server. It is
// never sent to the browser.

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const {
    candidate_name,
    candidate_role,
    total_score,
    total_marks,
    percentage,
    passed,
    elapsed_seconds,
    section_scores,
    answers
  } = payload;

  // Basic shape validation - reject obviously malformed submissions.
  if (
    typeof candidate_name !== 'string' || candidate_name.trim() === '' ||
    typeof total_score !== 'number' ||
    typeof total_marks !== 'number' ||
    typeof percentage !== 'number' ||
    typeof passed !== 'boolean'
  ) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing or invalid fields' }) };
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
    .insert([{
      candidate_name: candidate_name.trim(),
      candidate_role: (candidate_role || '').trim() || null,
      total_score,
      total_marks,
      percentage,
      passed,
      elapsed_seconds: elapsed_seconds ?? null,
      section_scores: section_scores ?? null,
      answers: answers ?? null
    }])
    .select('id')
    .single();

  if (error) {
    console.error('Supabase insert error', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not save result' }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, id: data.id })
  };
};
