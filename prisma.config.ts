import path from "node:path";
import { defineConfig } from "prisma/config";
import { loadEnvConfig } from "@next/env";
import { assertEnvironmentAlignment } from "./src/lib/environment";

const selectedEnvironment =
  process.env.PRISMA_ENV ||
  process.env.APP_ENV ||
  (process.env.VERCEL_ENV ? "production" : process.env.NODE_ENV) ||
  "development";

// During Vercel's dependency-install phase, Prisma runs from postinstall
// before Next.js guarantees NODE_ENV. Keep the environment guard active by
// aligning the missing runtime value with the explicitly selected target.
if (!process.env.NODE_ENV) {
  Reflect.set(process.env, "NODE_ENV", selectedEnvironment);
}

loadEnvConfig(__dirname, selectedEnvironment !== "production");
const environment = assertEnvironmentAlignment("Prisma CLI");

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: environment.directUrl || environment.databaseUrl,
  },
});
