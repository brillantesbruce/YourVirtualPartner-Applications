const { appDefinitions, createAppClient } = require("./app-registry");
const PROPERTY_MANAGEMENT_PUBLIC_DATA = require("../../apps/property-management-assessment/questions");
const PROPERTY_MANAGEMENT_ANSWER_KEY = require("./property-management-answer-key");
const REAL_ESTATE_PUBLIC_DATA = require("../../apps/real-estate-assessment/questions");
const REAL_ESTATE_ANSWER_KEY = require("./real-estate-answer-key");

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

const DIGITAL_MARKETING_ANSWER_KEY = [
  1, 1, 1, 2, 0, 1, 2, 0,
  1, 1, 2, 1, 1, 1, 1, 0,
  0, 1, 1, 2, 1, 1, 0, 1,
  2, 1, 1, 1, 1, 1, 1, 1,
  0, 0, 0, 1, 1, 1, 1, 2,
];
const DIGITAL_MARKETING_SECTIONS = [
  "Lead Generation",
  "SEO",
  "LinkedIn Marketing",
  "Meta (Facebook/Instagram) Advertising",
  "Video vs. Static Creative Strategy",
];

const PROPERTY_MANAGEMENT_SECTIONS = PROPERTY_MANAGEMENT_PUBLIC_DATA.sections;

function validatePropertyManagementResult(result) {
  if (
    typeof result.candidate_name !== "string" || !result.candidate_name.trim()
    || result.candidate_name.length > 120
    || !Number.isInteger(result.elapsed_seconds) || result.elapsed_seconds < 0 || result.elapsed_seconds > 2100
    || typeof result.auto_submitted !== "boolean"
    || !Array.isArray(result.answers) || result.answers.length !== PROPERTY_MANAGEMENT_ANSWER_KEY.length
    || !result.answers.every((answer) => Number.isInteger(answer) && answer >= -1 && answer <= 3)
  ) return null;

  const fullMarks = 100 / PROPERTY_MANAGEMENT_ANSWER_KEY.length;
  const sectionScores = PROPERTY_MANAGEMENT_SECTIONS.map(() => 0);
  const sectionMaxima = PROPERTY_MANAGEMENT_SECTIONS.map(() => 0);
  const letters = ["A", "B", "C", "D"];
  let rawScore = 0;
  const answers = result.answers.map((selectedIndex, index) => {
    const publicQuestion = PROPERTY_MANAGEMENT_PUBLIC_DATA.qs[index];
    const answerKey = PROPERTY_MANAGEMENT_ANSWER_KEY[index];
    const sectionIndex = publicQuestion.sec - 1;
    const isCorrect = selectedIndex === answerKey.correct;
    const earned = isCorrect ? fullMarks : answerKey.partial.includes(selectedIndex) ? 2 : 0;
    rawScore += earned;
    sectionScores[sectionIndex] += earned;
    sectionMaxima[sectionIndex] += fullMarks;

    return {
      number: index + 1,
      topic: PROPERTY_MANAGEMENT_SECTIONS[sectionIndex],
      question: publicQuestion.q,
      candidateAnswer: selectedIndex < 0 ? null : `${letters[selectedIndex]}) ${publicQuestion.o[selectedIndex]}`,
      correctAnswer: `${letters[answerKey.correct]}) ${publicQuestion.o[answerKey.correct]}`,
      result: isCorrect ? "Correct" : earned > 0 ? "Partial" : selectedIndex < 0 ? "Unanswered" : "Incorrect",
      earned: Number(earned.toFixed(2)),
      points: Number(fullMarks.toFixed(2)),
      explanation: answerKey.explanation,
    };
  });

  const score = Math.round(rawScore);
  const scoreBand = score >= 90 ? "Excellent"
    : score >= 75 ? "Good"
      : score >= 60 ? "Adequate" : "Below 60";

  return {
    candidate_name: result.candidate_name.trim(),
    score,
    score_band: scoreBand,
    passed: score >= 75,
    elapsed_seconds: result.elapsed_seconds,
    auto_submitted: result.auto_submitted,
    section_scores: Object.fromEntries(PROPERTY_MANAGEMENT_SECTIONS.map((section, index) => [
      section,
      `${sectionScores[index].toFixed(1)} / ${sectionMaxima[index].toFixed(1)}`,
    ])),
    answers,
  };
}

function validateRealEstateResult(result) {
  if (
    typeof result.candidate_name !== "string" || !result.candidate_name.trim()
    || result.candidate_name.length > 120
    || result.candidate_name.trim().split(/\s+/).length < 2
    || !Number.isInteger(result.elapsed_seconds) || result.elapsed_seconds < 0 || result.elapsed_seconds > 2100
    || typeof result.auto_submitted !== "boolean"
    || !Array.isArray(result.answers) || result.answers.length !== REAL_ESTATE_ANSWER_KEY.length
    || !result.answers.every((answer) => Number.isInteger(answer) && answer >= -1 && answer <= 3)
  ) return null;

  const sectionScores = REAL_ESTATE_PUBLIC_DATA.sections.map(() => 0);
  const sectionMaxima = REAL_ESTATE_PUBLIC_DATA.sections.map(() => 0);
  const letters = ["A", "B", "C", "D"];
  let score = 0;
  const answers = result.answers.map((selectedIndex, index) => {
    const question = REAL_ESTATE_PUBLIC_DATA.qs[index];
    const answerKey = REAL_ESTATE_ANSWER_KEY[index];
    const sectionIndex = question.sec - 1;
    const correct = selectedIndex === answerKey.correct;
    if (correct) {
      score += 1;
      sectionScores[sectionIndex] += 1;
    }
    sectionMaxima[sectionIndex] += 1;

    return {
      number: index + 1,
      topic: REAL_ESTATE_PUBLIC_DATA.sections[sectionIndex],
      question: question.q,
      candidateAnswer: selectedIndex < 0 ? null : `${letters[selectedIndex]}) ${question.o[selectedIndex]}`,
      correctAnswer: `${letters[answerKey.correct]}) ${question.o[answerKey.correct]}`,
      result: selectedIndex < 0 ? "Unanswered" : correct ? "Correct" : "Incorrect",
      earned: correct ? 1 : 0,
      points: 1,
      explanation: answerKey.explanation,
    };
  });
  const scoreBand = score === 15 ? "Excellent" : score >= 13 ? "Strong pass" : score >= 12 ? "Pass" : "Below 12";

  return {
    candidate_name: result.candidate_name.trim(),
    score,
    score_band: scoreBand,
    percentage: Math.round(score / REAL_ESTATE_ANSWER_KEY.length * 100),
    passed: score >= 12,
    elapsed_seconds: result.elapsed_seconds,
    auto_submitted: result.auto_submitted,
    section_scores: Object.fromEntries(REAL_ESTATE_PUBLIC_DATA.sections.map((section, index) => [
      section,
      `${sectionScores[index]} / ${sectionMaxima[index]}`,
    ])),
    answers,
  };
}

function validateDigitalMarketingResult(result) {
  if (
    typeof result.candidate_name !== "string" || !result.candidate_name.trim()
    || result.candidate_name.length > 120
    || !Number.isInteger(result.elapsed_seconds) || result.elapsed_seconds < 0 || result.elapsed_seconds > 3600
    || typeof result.auto_submitted !== "boolean"
    || !Array.isArray(result.answers) || result.answers.length !== DIGITAL_MARKETING_ANSWER_KEY.length
    || !result.answers.every((answer) => isRecord(answer)
      && Number.isInteger(answer.answer) && answer.answer >= -1 && answer.answer <= 3
      && typeof answer.question === "string" && answer.question.length <= 1000)
  ) return null;

  const sectionScores = Object.fromEntries(DIGITAL_MARKETING_SECTIONS.map((section) => [section, 0]));
  let score = 0;
  const letters = ["A", "B", "C", "D"];
  const answers = result.answers.map((answer, index) => {
    const section = DIGITAL_MARKETING_SECTIONS[Math.floor(index / 8)];
    const correctIndex = DIGITAL_MARKETING_ANSWER_KEY[index];
    const selectedIndex = answer.answer;
    const isCorrect = selectedIndex === correctIndex;
    if (isCorrect) {
      score += 1;
      sectionScores[section] += 1;
    }

    return {
      number: index + 1,
      topic: section,
      question: answer.question,
      candidateAnswer: selectedIndex < 0 ? null : letters[selectedIndex],
      correctAnswer: letters[correctIndex],
      result: selectedIndex < 0 ? "Unanswered" : isCorrect ? "Correct" : "Incorrect",
    };
  });

  return {
    candidate_name: result.candidate_name.trim(),
    score,
    percentage: Math.round(score / DIGITAL_MARKETING_ANSWER_KEY.length * 100),
    passed: score >= 30,
    elapsed_seconds: result.elapsed_seconds,
    auto_submitted: result.auto_submitted,
    section_scores: sectionScores,
    answers,
  };
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
  "digital-marketing": validateDigitalMarketingResult,
  "property-management-assessment": validatePropertyManagementResult,
  "real-estate-assessment": validateRealEstateResult,
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

    const response = { ok: true, id: data.id };
    if (["property-management-assessment", "real-estate-assessment"].includes(definition.id)) {
      response.result = record;
    }
    return jsonResponse(200, response);
  } catch (error) {
    console.error(`Unexpected error storing ${definition.id} result`, error);
    return jsonResponse(500, { error: "Could not save result." });
  }
};
