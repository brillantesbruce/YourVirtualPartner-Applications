const { timingSafeEqual } = require("node:crypto");
const { appDefinitions, createAppClient } = require("./app-registry");

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

function isRecordId(value) {
  return typeof value === "string"
    && (/^[0-9]+$/.test(value) || /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value));
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    console.error("Missing ADMIN_PASSWORD environment variable");
    return jsonResponse(500, { error: "Admin portal is not configured." });
  }

  const suppliedPassword = event.headers["x-admin-password"] || "";
  if (!suppliedPassword || !passwordsMatch(suppliedPassword, expectedPassword)) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  if (!event.body || event.body.length > 20_000) {
    return jsonResponse(413, { error: "Selection is empty or too large." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return jsonResponse(400, { error: "Invalid JSON request." });
  }

  if (!payload || !Array.isArray(payload.records) || payload.records.length < 1 || payload.records.length > 100) {
    return jsonResponse(400, { error: "Select between 1 and 100 results to delete." });
  }

  const definitions = new Map(appDefinitions.map((definition) => [definition.id, definition]));
  const recordsByApp = new Map();
  const uniqueKeys = new Set();
  for (const record of payload.records) {
    if (
      !record || typeof record.appId !== "string" || !definitions.has(record.appId)
      || !isRecordId(record.id)
    ) {
      return jsonResponse(400, { error: "The selection contains an invalid result." });
    }
    const key = `${record.appId}:${record.id}`;
    if (uniqueKeys.has(key)) {
      return jsonResponse(400, { error: "The selection contains duplicate results." });
    }
    uniqueKeys.add(key);
    if (!recordsByApp.has(record.appId)) recordsByApp.set(record.appId, new Set());
    recordsByApp.get(record.appId).add(record.id);
  }

  const deleted = [];
  const failedApps = [];
  for (const [appId, ids] of recordsByApp) {
    const definition = definitions.get(appId);
    let client;
    try {
      client = createAppClient(definition);
    } catch (error) {
      console.error(`Invalid Supabase configuration for ${appId}`, error);
      failedApps.push(appId);
      continue;
    }
    if (!client) {
      console.error(`Missing Supabase environment variables for ${appId}`);
      failedApps.push(appId);
      continue;
    }

    try {
      const { data, error } = await client
        .from(definition.table)
        .delete()
        .in("id", [...ids])
        .select("id");
      if (error) {
        console.error(`Failed deleting selected ${appId} results`, error);
        failedApps.push(appId);
        continue;
      }
      data.forEach((row) => deleted.push({ appId, id: String(row.id) }));
    } catch (error) {
      console.error(`Unexpected error deleting selected ${appId} results`, error);
      failedApps.push(appId);
    }
  }

  return jsonResponse(failedApps.length ? 207 : 200, {
    deleted,
    failedApps,
  });
};
