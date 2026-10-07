const { createClient } = require("@supabase/supabase-js");

const BOOKKEEPER_REVIEW = [
  ["GST & BAS", 0], ["GST & BAS", 2], ["GST & BAS", 2], ["GST & BAS", 0],
  ["STP", 0], ["STP", 1], ["STP", 1],
  ["AP & AR", 1], ["AP & AR", 2], ["AP & AR", 1],
  ["Bank Reconciliation", 2], ["Bank Reconciliation", 2], ["Bank Reconciliation", 0],
  ["Financial Statements", 0], ["Financial Statements", 0], ["Financial Statements", 1],
  ["Prepayments & Accruals", 1], ["Prepayments & Accruals", 2],
  ["Prepayments & Accruals", 1], ["Prepayments & Accruals", 1],
];

const FPA_REVIEW = [
  ["Client fact-find", 2], ["Client communication", 1], ["Cash-flow analysis", 1],
  ["Superannuation scenario", 1], ["Risk profile", 2], ["Client wants to act quickly", 1],
  ["Insurance", 1], ["Retirement planning", 1], ["Documentation", 1],
  ["Investment review", 1], ["Diversification", 1], ["Client review preparation", 0],
  ["Changed circumstances", 1], ["Super contributions", 1], ["Client confidentiality", 2],
  ["Asset classes", 2], ["Implementation", 1], ["Adviser support", 1],
  ["Client complaint", 2], ["Professional judgment", 2],
];

const PARAPLANNER_REVIEW = [
  ["SOA preparation", 1], ["Strategy scenario", 1], ["Technical research", 1],
  ["SOA recommendation", 0], ["Scenario: inconsistent information", 2],
  ["Product comparison", 2], ["Retirement strategy", 1], ["Knowledge: SOA", 0],
  ["Strategy doesn't meet objective", 1], ["Contribution strategy", 0],
  ["Knowledge: concessional contributions", 0], ["ROA scenario", 0],
  ["Research quality", 1], ["Investment strategy", 1], ["Document checking", 1],
  ["Scenario: insurance", 0], ["Strategy modelling", 1],
  ["Knowledge: diversification", 0], ["Final quality check", 1],
  ["Scenario: adviser instruction", 1],
];

function answerReview(answers, metadata, times) {
  if (!Array.isArray(answers)) return [];
  const letters = ["A", "B", "C", "D"];
  return answers.map((answer, index) => {
    const [topic, correctIndex] = metadata[index] || [`Question ${index + 1}`, null];
    const selectedIndex = Number.isInteger(answer) && answer >= 0 ? answer : null;
    return {
      number: index + 1,
      topic,
      candidateAnswer: selectedIndex === null ? null : letters[selectedIndex] || "Invalid",
      correctAnswer: correctIndex === null ? null : letters[correctIndex],
      result: selectedIndex === null ? "Unanswered" : selectedIndex === correctIndex ? "Correct" : "Incorrect",
      timeSeconds: Array.isArray(times) && times[index] != null ? Number(times[index]) : null,
    };
  });
}

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
          answers: Array.isArray(row.answers) ? row.answers.map((answer) => ({
            number: answer.id,
            topic: answer.section,
            question: answer.title,
            candidateAnswer: answer.answer,
            earned: Number(answer.earned),
            points: Number(answer.points),
          })) : [],
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
          answers: answerReview(row.answers, BOOKKEEPER_REVIEW, row.time_used_seconds),
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
        details: {
          case_id: row.case_id,
          note: "This practice app stores only the case, score, and duration; field-by-field answers were not saved.",
        },
      };
    },
  },
  {
    id: "fpa-assessment",
    name: "Financial Planner Associate Exam",
    table: "fpa_assessment_submissions",
    urlVariable: "FPA_ASSESSMENT_SUPABASE_URL",
    keyVariable: "FPA_ASSESSMENT_SUPABASE_SERVICE_ROLE_KEY",
    select: "id, candidate_name, candidate_email, score, passed, elapsed_seconds, auto_submitted, answers, submitted_at",
    normalize(row) {
      return {
        candidate: row.candidate_name,
        assessment: "Financial Planner Associate Exam",
        score: `${row.score} / 20`,
        percentage: Number(row.score) * 5,
        outcome: row.passed ? "Pass" : "Not passed",
        durationSeconds: Number(row.elapsed_seconds),
        details: {
          candidate_email: row.candidate_email,
          auto_submitted: row.auto_submitted,
          answers: answerReview(row.answers, FPA_REVIEW),
        },
      };
    },
  },
  {
    id: "paraplanner-assessment",
    name: "Paraplanner Assessment",
    table: "paraplanner_assessment_submissions",
    urlVariable: "PARAPLANNER_ASSESSMENT_SUPABASE_URL",
    keyVariable: "PARAPLANNER_ASSESSMENT_SUPABASE_SERVICE_ROLE_KEY",
    select: "id, candidate_name, score, score_band, passed, unanswered_count, elapsed_seconds, timing_mode, auto_submitted, answers, submitted_at",
    normalize(row) {
      return {
        candidate: row.candidate_name,
        assessment: "Paraplanner Assessment",
        score: `${row.score} / 20`,
        percentage: Number(row.score) * 5,
        outcome: row.passed ? "Pass" : "Not passed",
        durationSeconds: Number(row.elapsed_seconds),
        details: {
          score_band: row.score_band,
          unanswered_count: row.unanswered_count,
          timing_mode: row.timing_mode,
          auto_submitted: row.auto_submitted,
          answers: answerReview(row.answers, PARAPLANNER_REVIEW),
        },
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
