import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertEnvironmentAlignment } from "./environment";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const environment = assertEnvironmentAlignment("Prisma runtime");
const pool = new Pool({ connectionString: environment.databaseUrl });

const adapter = new PrismaPg(pool as any);

function createPrismaClient() {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

// In development, regenerate the singleton if schema changed and a new delegate
// (e.g. `package`) is missing on the cached client.
const cachedClient = globalForPrisma.prisma;
const hasExpectedDelegates =
  cachedClient &&
  typeof (cachedClient as any).banner !== "undefined" &&
  typeof (cachedClient as any).agent !== "undefined" &&
  typeof (cachedClient as any).package !== "undefined" &&
  typeof (cachedClient as any).dailyPerformanceLog !== "undefined" &&
  typeof (cachedClient as any).adminProfile !== "undefined" &&
  typeof (cachedClient as any).chatSession !== "undefined" &&
  typeof (cachedClient as any).chatMessage !== "undefined" &&
  typeof (cachedClient as any).knowledgeSnapshot !== "undefined" &&
  typeof (cachedClient as any).contentAgentConfig !== "undefined" &&
  typeof (cachedClient as any).contentAgentRun !== "undefined" &&
  typeof (cachedClient as any).contentAgentDraft !== "undefined" &&
  typeof (cachedClient as any).article !== "undefined";

export const prisma = hasExpectedDelegates ? cachedClient : createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
