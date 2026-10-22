const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const appsDirectory = path.join(root, "apps");
const outputDirectory = path.join(root, "dist");
const trainingDirectory = path.join(appsDirectory, "training-sandbox");
const viteCli = path.join(root, "node_modules", "vite", "bin", "vite.js");

function copyAppFiles(appName, fileNames) {
  const sourceDirectory = path.join(appsDirectory, appName);
  const targetDirectory = path.join(outputDirectory, appName);
  fs.mkdirSync(targetDirectory, { recursive: true });

  for (const fileName of fileNames) {
    fs.copyFileSync(
      path.join(sourceDirectory, fileName),
      path.join(targetDirectory, fileName),
    );
  }
}

if (!fs.existsSync(viteCli)) {
  throw new Error("Training sandbox dependencies are missing; install them in apps/training-sandbox first.");
}

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

copyAppFiles("broker-support-assessment", ["index.html"]);
copyAppFiles("bookkeeper-assessment", ["index.html"]);
copyAppFiles("FPA-assessment", ["index.html"]);
copyAppFiles("Paraplanner-assessment", ["index.html"]);
const digitalMarketingDirectory = path.join(appsDirectory, "digital-marketing");
const digitalMarketingOutput = path.join(outputDirectory, "digital-marketing");
fs.mkdirSync(digitalMarketingOutput, { recursive: true });
fs.copyFileSync(
  path.join(digitalMarketingDirectory, "Digital-Marketing-Manager-Certification-Exam.html"),
  path.join(digitalMarketingOutput, "index.html"),
);
const propertyManagementDirectory = path.join(appsDirectory, "property-management-assessment");
const propertyManagementOutput = path.join(outputDirectory, "property-management-assessment");
fs.mkdirSync(propertyManagementOutput, { recursive: true });
fs.copyFileSync(
  path.join(propertyManagementDirectory, "property-management-assistant-exam.html"),
  path.join(propertyManagementOutput, "index.html"),
);
fs.copyFileSync(
  path.join(propertyManagementDirectory, "questions.js"),
  path.join(propertyManagementOutput, "questions.js"),
);
const realEstateDirectory = path.join(appsDirectory, "real-estate-assessment");
const realEstateOutput = path.join(outputDirectory, "real-estate-assessment");
fs.mkdirSync(realEstateOutput, { recursive: true });
fs.copyFileSync(
  path.join(realEstateDirectory, "real-estate-agent-assistant-certification-exam.html"),
  path.join(realEstateOutput, "index.html"),
);
fs.copyFileSync(
  path.join(realEstateDirectory, "questions.js"),
  path.join(realEstateOutput, "questions.js"),
);
copyAppFiles("calculators", [
  "index.html",
  "default_calculator.html",
  "loan_and_amortisation_calculator.html",
  "repayment_schedule_builder.html",
  "personal_loan_repayments.html"
]);
fs.copyFileSync(path.join(root, "public", "index.html"), path.join(outputDirectory, "index.html"));
fs.copyFileSync(path.join(root, "public", "admin.html"), path.join(outputDirectory, "admin.html"));
fs.copyFileSync(
  path.join(trainingDirectory, "src", "attempt-session.js"),
  path.join(outputDirectory, "attempt-session.js"),
);

execFileSync(process.execPath, [viteCli, "build"], {
  cwd: trainingDirectory,
  stdio: "inherit",
});
fs.cpSync(
  path.join(trainingDirectory, "dist"),
  path.join(outputDirectory, "training-sandbox"),
  { recursive: true },
);
