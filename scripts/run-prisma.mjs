import path from "node:path";
import { spawn } from "node:child_process";
import { checkEnvironment, normalizeEnvironment } from "./environment-utils.mjs";

const [environmentArg, ...prismaArgs] = process.argv.slice(2);
const environment = normalizeEnvironment(environmentArg);

if (!environmentArg || prismaArgs.length === 0) {
  console.error(
    "Usage: node scripts/run-prisma.mjs <development|production> <prisma args...>"
  );
  process.exit(1);
}

try {
  const result = checkEnvironment(environment);
  console.log(`[prisma:${environment}] Using Supabase project ${result.projectRef}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const prismaCli = path.join(
  process.cwd(),
  "node_modules",
  "prisma",
  "build",
  "index.js"
);
const child = spawn(process.execPath, [prismaCli, ...prismaArgs], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: environment,
    PRISMA_ENV: environment,
  },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
