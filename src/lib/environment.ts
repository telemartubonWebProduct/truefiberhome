type RuntimeEnvironment = "development" | "production" | "test";

function cleanEnvValue(value: string | undefined) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

export function getSupabaseProjectRef(value: string | undefined) {
  const normalized = cleanEnvValue(value);
  if (!normalized) return null;

  try {
    const hostname = new URL(normalized).hostname.toLowerCase();
    return hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getDatabaseProjectRef(value: string | undefined) {
  const normalized = cleanEnvValue(value);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    const directRef = url.hostname
      .toLowerCase()
      .match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1];
    if (directRef) return directRef;

    return decodeURIComponent(url.username)
      .toLowerCase()
      .match(/^postgres\.([a-z0-9]+)$/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function resolveRuntimeEnvironment(): RuntimeEnvironment {
  const value = cleanEnvValue(process.env.NODE_ENV);
  if (value === "production" || value === "test") return value;
  return "development";
}

export function assertEnvironmentAlignment(context = "server runtime") {
  const runtimeEnvironment = resolveRuntimeEnvironment();
  const configuredEnvironment = cleanEnvValue(process.env.APP_ENV);
  const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const databaseUrl = cleanEnvValue(process.env.DATABASE_URL);
  const directUrl = cleanEnvValue(process.env.DIRECT_URL);

  if (
    configuredEnvironment &&
    configuredEnvironment !== runtimeEnvironment
  ) {
    throw new Error(
      `[environment:${context}] APP_ENV=${configuredEnvironment} does not match NODE_ENV=${runtimeEnvironment}.`
    );
  }

  if (!supabaseUrl || !databaseUrl || !directUrl) {
    throw new Error(
      `[environment:${context}] NEXT_PUBLIC_SUPABASE_URL, DATABASE_URL, and DIRECT_URL are required.`
    );
  }

  const supabaseProjectRef = getSupabaseProjectRef(supabaseUrl);
  const databaseProjectRef = getDatabaseProjectRef(databaseUrl);
  const directProjectRef = getDatabaseProjectRef(directUrl);

  if (!supabaseProjectRef || !databaseProjectRef || !directProjectRef) {
    throw new Error(
      `[environment:${context}] Could not identify the Supabase project ref from all connection URLs.`
    );
  }

  const projectRefs = new Set([
    supabaseProjectRef,
    databaseProjectRef,
    directProjectRef,
  ]);

  if (projectRefs.size !== 1) {
    throw new Error(
      `[environment:${context}] Supabase and Prisma point to different projects (${Array.from(projectRefs).join(", ")}).`
    );
  }

  return {
    runtimeEnvironment,
    projectRef: supabaseProjectRef,
    supabaseUrl,
    databaseUrl,
    directUrl,
  };
}
