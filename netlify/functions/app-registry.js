const { createClient } = require("@supabase/supabase-js");

const appDefinitions = [
  {
    id: "broker-support-assessment",
    name: "Broker Support Assessment",
    table: "quiz_attempts",
    urlVariable: "BROKER_SUPPORT_SUPABASE_URL",
    keyVariable: "BROKER_SUPPORT_SUPABASE_SERVICE_ROLE_KEY",
    select: "id, candidate_name, candidate_role, total_score, total_marks, percentage, passed, elapsed_seconds, section_scores, answers, submitted_at",
    normalize(row) {
      return {
        candidate: row.candidate_name,
        assessment: "Broker Support Assessment",
        score: `${Number(row.total_score).toFixed(1)} / ${row.total_marks}`,
        percentage: Number(row.percentage),
        outcome: row.passed ? "Pass" : "Not passed",
        durationSeconds: row.elapsed_seconds == null ? null : Number(row.elapsed_seconds),
        details: {
          candidate_role: row.candidate_role,
          section_scores: row.section_scores,
          answers: row.answers,
        },
      };
    },
  },
  {
    id: "bookkeeper-assessment",
    name: "Bookkeeping Technical Assessment",
    table: "bookkeeping_assessment_submissions",
    urlVariable: "BOOKKEEPER_SUPABASE_URL",
    keyVariable: "BOOKKEEPER_SUPABASE_SERVICE_ROLE_KEY",
    select: "id, candidate_name, score, score_band, time_used_seconds, answers, submitted_at",
    normalize(row) {
      return {
        candidate: row.candidate_name,
        assessment: "Bookkeeping Technical Assessment",
        score: `${row.score} / 20`,
        percentage: Number(row.score) * 5,
        outcome: row.score >= 16 ? "Pass" : "Not passed",
        durationSeconds: Array.isArray(row.time_used_seconds)
          ? row.time_used_seconds.reduce((sum, value) => sum + Number(value || 0), 0)
          : null,
        details: {
          score_band: row.score_band,
          time_used_seconds: row.time_used_seconds,
          answers: row.answers,
        },
      };
    },
  },
  {
    id: "training-sandbox",
    name: "Broker Training Sandbox",
    table: "leaderboard_attempts",
    urlVariable: "TRAINING_SANDBOX_SUPABASE_URL",
    keyVariable: "TRAINING_SANDBOX_SUPABASE_SERVICE_ROLE_KEY",
    select: "id, trainee_name, case_id, case_title, accuracy_pct, time_seconds, submitted_at",
    normalize(row) {
      return {
        candidate: row.trainee_name,
        assessment: row.case_title,
        score: String(row.accuracy_pct),
        percentage: Number(row.accuracy_pct),
        outcome: null,
        durationSeconds: Number(row.time_seconds),
        details: { case_id: row.case_id },
      };
    },
  },
];

function createAppClient(definition) {
  const url = process.env[definition.urlVariable];
  const serviceRoleKey = process.env[definition.keyVariable];
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

module.exports = { appDefinitions, createAppClient };
