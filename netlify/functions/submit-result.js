const { appDefinitions, createAppClient } = require("./app-registry");

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(payload),
  };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNumberBetween(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isSessionId(value) {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validateBrokerResult(result) {
  if (
    typeof result.candidate_name !== "string" || !result.candidate_name.trim()
    || result.candidate_name.length > 120
    || typeof result.candidate_role !== "string" || result.candidate_role.length > 120
    || !isNumberBetween(result.total_score, 0, 10000)
    || !isNumberBetween(result.total_marks, 1, 10000)
    || result.total_score > result.total_marks
    || !isNumberBetween(result.percentage, 0, 100)
    || typeof result.passed !== "boolean"
    || !isNumberBetween(result.elapsed_seconds, 0, 86400)
    || !isRecord(result.section_scores)
    || !Array.isArray(result.answers)
  ) return null;

  return {
    candidate_name: result.candidate_name.trim(),
    candidate_role: result.candidate_role.trim() || null,
    total_score: result.total_score,
    total_marks: result.total_marks,
    percentage: result.percentage,
    passed: result.passed,
    elapsed_seconds: result.elapsed_seconds,
    section_scores: result.section_scores,
    answers: result.answers,
  };
}

function validateBookkeeperResult(result) {
  if (
    typeof result.candidate_name !== "string" || !result.candidate_name.trim()
    || result.candidate_name.length > 120
    || !Number.isInteger(result.score) || result.score < 0 || result.score > 20
    || typeof result.score_band !== "string" || !result.score_band.trim()
    || result.score_band.length > 100
    || !Array.isArray(result.time_used_seconds) || result.time_used_seconds.length !== 20
    || !result.time_used_seconds.every((value) => Number.isInteger(value) && value >= 0 && value <= 40)
    || !Array.isArray(result.answers) || result.answers.length !== 20
    || !result.answers.every((value) => Number.isInteger(value) && value >= -1 && value <= 3)
  ) return null;

  return {
    candidate_name: result.candidate_name.trim(),
    score: result.score,
    score_band: result.score_band.trim(),
    time_used_seconds: result.time_used_seconds,
    answers: result.answers,
  };
}

function validateTrainingResult(result) {
  if (
    typeof result.trainee_name !== "string" || !result.trainee_name.trim()
    || result.trainee_name.length > 80
    || typeof result.case_id !== "string" || !result.case_id.trim() || result.case_id.length > 80
    || typeof result.case_title !== "string" || !result.case_title.trim() || result.case_title.length > 160
    || !Number.isInteger(result.accuracy_pct) || result.accuracy_pct < 0 || result.accuracy_pct > 100
    || !isNumberBetween(result.time_seconds, 0, 86400)
  ) return null;

  return {
    trainee_name: result.trainee_name.trim(),
    case_id: result.case_id.trim(),
    case_title: result.case_title.trim(),
    accuracy_pct: result.accuracy_pct,
    time_seconds: Number(result.time_seconds.toFixed(2)),
  };
}

function validateFpaResult(result) {
  if (
    typeof result.candidate_name !== "string" || !result.candidate_name.trim()
    || result.candidate_name.length > 120
    || (result.candidate_email !== null && result.candidate_email !== ""
      && (typeof result.candidate_email !== "string" || result.candidate_email.length > 254
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.candidate_email)))
    || !Number.isInteger(result.score) || result.score < 0 || result.score > 20
    || typeof result.passed !== "boolean"
    || result.passed !== (result.score >= 16)
    || !isNumberBetween(result.elapsed_seconds, 0, 2400)
    || typeof result.auto_submitted !== "boolean"
    || !Array.isArray(result.answers) || result.answers.length !== 20
    || !result.answers.every((value) => Number.isInteger(value) && value >= -1 && value <= 3)
  ) return null;

  return {
    candidate_name: result.candidate_name.trim(),
    candidate_email: result.candidate_email ? result.candidate_email.trim() : null,
    score: result.score,
    passed: result.passed,
    elapsed_seconds: Math.round(result.elapsed_seconds),
    auto_submitted: result.auto_submitted,
    answers: result.answers,
  };
}

function validateParaplannerResult(result) {
  if (
    typeof result.candidate_name !== "string" || !result.candidate_name.trim()
    || result.candidate_name.length > 120
    || !Number.isInteger(result.score) || result.score < 0 || result.score > 20
    || typeof result.score_band !== "string" || !result.score_band.trim() || result.score_band.length > 60
    || typeof result.passed !== "boolean"
    || result.passed !== (result.score >= 16)
    || !Number.isInteger(result.unanswered_count) || result.unanswered_count < 0 || result.unanswered_count > 20
    || !isNumberBetween(result.elapsed_seconds, 0, 2400)
    || !["q40", "q60", "t40"].includes(result.timing_mode)
    || typeof result.auto_submitted !== "boolean"
    || !Array.isArray(result.answers) || result.answers.length !== 20
    || !result.answers.every((value) => Number.isInteger(value) && value >= -1 && value <= 3)
    || result.unanswered_count !== result.answers.filter((value) => value === -1).length
  ) return null;

  return {
    candidate_name: result.candidate_name.trim(),
    score: result.score,
    score_band: result.score_band.trim(),
    passed: result.passed,
    unanswered_count: result.unanswered_count,
    elapsed_seconds: Math.round(result.elapsed_seconds),
    timing_mode: result.timing_mode,
    auto_submitted: result.auto_submitted,
    answers: result.answers,
  };
}

const validators = {
  "broker-support-assessment": validateBrokerResult,
  "bookkeeper-assessment": validateBookkeeperResult,
  "training-sandbox": validateTrainingResult,
  "fpa-assessment": validateFpaResult,
  "paraplanner-assessment": validateParaplannerResult,
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  if (!event.body || event.body.length > 200_000) {
    return jsonResponse(413, { error: "Submission is empty or too large." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return jsonResponse(400, { error: "Invalid JSON submission." });
  }

  if (!isRecord(payload) || typeof payload.app_id !== "string" || !isRecord(payload.result)) {
    return jsonResponse(400, { error: "Missing app identifier or result." });
  }
  if (!isSessionId(payload.result.session_id)) {
    return jsonResponse(400, { error: "A valid browser session ID is required." });
  }

  const definition = appDefinitions.find((app) => app.id === payload.app_id);
  const validate = validators[payload.app_id];
  if (!definition || !validate) {
    return jsonResponse(400, { error: "Unknown app identifier." });
  }

  const record = validate(payload.result);
  if (!record) {
    return jsonResponse(400, { error: "Result fields are missing or invalid." });
  }
  record.session_id = payload.result.session_id;

  let client;
  try {
    client = createAppClient(definition);
  } catch (error) {
    console.error(`Invalid Supabase configuration for ${definition.id}`, error);
    return jsonResponse(500, { error: "Result storage is not configured correctly for this app." });
  }
  if (!client) {
    console.error(`Missing Supabase environment variables for ${definition.id}`);
    return jsonResponse(500, { error: "Result storage is not configured for this app." });
  }

  try {
    const { data, error } = await client.from(definition.table).insert(record).select("id").single();
    if (error) {
      if (error.code === "23505") {
        return jsonResponse(409, { error: "You have already submitted an assessment." });
      }
      console.error(`Failed to store ${definition.id} result`, error);
      return jsonResponse(500, { error: "Could not save result." });
    }

    return jsonResponse(200, { ok: true, id: data.id });
  } catch (error) {
    console.error(`Unexpected error storing ${definition.id} result`, error);
    return jsonResponse(500, { error: "Could not save result." });
  }
};
