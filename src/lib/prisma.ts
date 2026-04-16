import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
  typeof (cachedClient as any).package !== "undefined";

export const prisma = hasExpectedDelegates ? cachedClient : createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
