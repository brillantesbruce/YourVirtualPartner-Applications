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

async function loadAppResults(definition) {
  try {
    const client = createAppClient(definition);
    if (!client) {
      return {
        id: definition.id,
        name: definition.name,
        status: "not-configured",
        error: `Missing ${definition.urlVariable} or ${definition.keyVariable}.`,
        attempts: [],
      };
    }

    const { data, error } = await client
      .from(definition.table)
      .select(definition.select)
      .order("submitted_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error(`Failed loading ${definition.id} results`, error);
      return {
        id: definition.id,
        name: definition.name,
        status: "error",
        error: "Could not load results from this app's database.",
        attempts: [],
      };
    }

    return {
      id: definition.id,
      name: definition.name,
      status: "ok",
      count: data.length,
      attempts: data.map((row) => ({
        id: `${definition.id}-${row.id}`,
        appId: definition.id,
        appName: definition.name,
        submittedAt: row.submitted_at,
        ...definition.normalize(row),
      })),
    };
  } catch (error) {
    console.error(`Unexpected error loading ${definition.id} results`, error);
    return {
      id: definition.id,
      name: definition.name,
      status: "error",
      error: "Could not load results from this app's database.",
      attempts: [],
    };
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    console.error("Missing ADMIN_PASSWORD environment variable");
    return jsonResponse(500, { error: "Admin portal is not configured." });
  }

  const suppliedPassword = event.headers["x-admin-password"] || "";
  if (!suppliedPassword || !passwordsMatch(suppliedPassword, expectedPassword)) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  const apps = await Promise.all(appDefinitions.map(loadAppResults));
  const attempts = apps.flatMap((app) => app.attempts)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return jsonResponse(200, { apps, attempts });
};
