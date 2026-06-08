import path from "node:path";
import { defineConfig } from "prisma/config";
import { loadEnvConfig } from "@next/env";
import { assertEnvironmentAlignment } from "./src/lib/environment";

const selectedEnvironment =
  process.env.PRISMA_ENV || process.env.NODE_ENV || "development";
loadEnvConfig(__dirname, selectedEnvironment !== "production");
const environment = assertEnvironmentAlignment("Prisma CLI");

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: environment.directUrl || environment.databaseUrl,
  },
});
