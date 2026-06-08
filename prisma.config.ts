import path from "node:path";
import { defineConfig } from "prisma/config";
import { loadEnvConfig } from "@next/env";

const selectedEnvironment =
  process.env.PRISMA_ENV ||
  process.env.APP_ENV ||
  (process.env.VERCEL_ENV ? "production" : process.env.NODE_ENV) ||
  "development";

loadEnvConfig(__dirname, selectedEnvironment !== "production");
const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  // `prisma generate` does not connect to the database, so datasource is
  // optional during Vercel's dependency-install phase. Database commands and
  // production builds are validated by run-prisma.mjs/check-environment.mjs.
  ...(datasourceUrl ? { datasource: { url: datasourceUrl } } : {}),
});
