const { timingSafeEqual } = require("node:crypto");
const { createClient } = require("@supabase/supabase-js");

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(payload),
  };
}

function passwordsMatch(supplied, expected) {
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length
    && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const suppliedPassword = event.headers["x-admin-password"] || "";
  if (!adminPassword) {
    console.error("Missing ADMIN_PASSWORD environment variable");
    return jsonResponse(500, { error: "Admin endpoint is not configured" });
  }
  if (!suppliedPassword || !passwordsMatch(suppliedPassword, adminPassword)) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase server environment variables");
    return jsonResponse(500, { error: "Admin endpoint is not configured" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("leaderboard_attempts")
    .select("id, trainee_name, case_id, case_title, accuracy_pct, time_seconds, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Supabase results query failed", error);
    return jsonResponse(500, { error: "Could not load results" });
  }

  return jsonResponse(200, { attempts: data });
};
