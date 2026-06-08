import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

const ENVIRONMENTS = new Set(["development", "production", "test"]);

export function normalizeEnvironment(value) {
  return ENVIRONMENTS.has(value) ? value : "development";
}

function loadFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return parseEnv(fs.readFileSync(filePath, "utf8"));
}

export function loadEnvironmentFiles(environment, cwd = process.cwd()) {
  const mode = normalizeEnvironment(environment);
  const files = [
    ".env",
    `.env.${mode}`,
    ...(mode === "test" ? [] : [".env.local"]),
    `.env.${mode}.local`,
  ];
  const values = {};

  for (const file of files) {
    Object.assign(values, loadFile(path.join(cwd, file)));
  }

  return {
    files: files.filter((file) => fs.existsSync(path.join(cwd, file))),
    values: { ...values, ...process.env },
  };
}

export function supabaseProjectRef(value) {
  if (!value) return null;
  try {
    return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function databaseProjectRef(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const directRef = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1];
    if (directRef) return directRef;
    return decodeURIComponent(url.username).match(/^postgres\.([a-z0-9]+)$/i)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function inspectEnvironment(environment, cwd = process.cwd()) {
  const mode = normalizeEnvironment(environment);
  const loaded = loadEnvironmentFiles(mode, cwd);
  const values = loaded.values;
  const missing = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "DATABASE_URL",
    "DIRECT_URL",
  ].filter((key) => !values[key]);
  if (!values.SUPABASE_SECRET_KEY && !values.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push("SUPABASE_SECRET_KEY");
  }
  const refs = {
    supabase: supabaseProjectRef(values.NEXT_PUBLIC_SUPABASE_URL),
    database: databaseProjectRef(values.DATABASE_URL),
    direct: databaseProjectRef(values.DIRECT_URL),
  };
  const uniqueRefs = new Set(Object.values(refs).filter(Boolean));
  const configuredEnvironment = values.APP_ENV;

  return {
    mode,
    files: loaded.files,
    missing,
    refs,
    projectRef: uniqueRefs.size === 1 ? Array.from(uniqueRefs)[0] : null,
    aligned:
      missing.length === 0 &&
      Boolean(refs.supabase && refs.database && refs.direct) &&
      uniqueRefs.size === 1,
    environmentMatches:
      !configuredEnvironment || configuredEnvironment === mode,
  };
}

export function checkEnvironment(environment, options = {}) {
  const cwd = options.cwd || process.cwd();
  const result = inspectEnvironment(environment, cwd);

  if (result.missing.length > 0) {
    throw new Error(
      `[env:${result.mode}] Missing variables: ${result.missing.join(", ")}`
    );
  }

  if (!result.environmentMatches) {
    throw new Error(
      `[env:${result.mode}] APP_ENV does not match the selected environment.`
    );
  }

  if (!result.aligned) {
    throw new Error(
      `[env:${result.mode}] Supabase URL, DATABASE_URL, and DIRECT_URL do not point to one project (${Object.values(result.refs).filter(Boolean).join(", ")}).`
    );
  }

  if (result.mode === "development") {
    const production = inspectEnvironment("production", cwd);
    if (
      production.projectRef &&
      production.projectRef === result.projectRef
    ) {
      const message = `[env:development] Warning: development and production currently use the same Supabase project (${result.projectRef}).`;
      if (options.strictIsolation) throw new Error(message);
      console.warn(message);
    }
  }

  return result;
}
