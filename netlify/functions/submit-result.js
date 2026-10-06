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

const validators = {
  "broker-support-assessment": validateBrokerResult,
  "bookkeeper-assessment": validateBookkeeperResult,
  "training-sandbox": validateTrainingResult,
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

  const definition = appDefinitions.find((app) => app.id === payload.app_id);
  const validate = validators[payload.app_id];
  if (!definition || !validate) {
    return jsonResponse(400, { error: "Unknown app identifier." });
  }

  const record = validate(payload.result);
  if (!record) {
    return jsonResponse(400, { error: "Result fields are missing or invalid." });
  }

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
      console.error(`Failed to store ${definition.id} result`, error);
      return jsonResponse(500, { error: "Could not save result." });
    }

    return jsonResponse(200, { ok: true, id: data.id });
  } catch (error) {
    console.error(`Unexpected error storing ${definition.id} result`, error);
    return jsonResponse(500, { error: "Could not save result." });
  }
};
