import { checkEnvironment, normalizeEnvironment } from "./environment-utils.mjs";

const environment = normalizeEnvironment(process.argv[2] || process.env.NODE_ENV);
const strictIsolation = process.argv.includes("--strict-isolation");

try {
  const result = checkEnvironment(environment, { strictIsolation });
  console.log(
    `[env:${result.mode}] OK - project ${result.projectRef}; files: ${result.files.join(", ")}`
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
