import { prisma } from "@/src/lib/prisma";

const DEFAULT_CHAT_EXPIRY_MINUTES = 60;
const DEFAULT_SWEEP_INTERVAL_SECONDS = 120;

let lastCleanupAt = 0;
let cleanupInFlight: Promise<number> | null = null;

function parsePositiveInt(value: string | undefined, fallbackValue: number) {
  if (!value) {
    return fallbackValue;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return parsed;
}

export function getChatExpiryMinutes() {
  return parsePositiveInt(process.env.CHAT_SESSION_EXPIRY_MINUTES, DEFAULT_CHAT_EXPIRY_MINUTES);
}

function getCleanupIntervalMs() {
  const sweepSeconds = parsePositiveInt(
    process.env.CHAT_CLEANUP_SWEEP_SECONDS,
    DEFAULT_SWEEP_INTERVAL_SECONDS
  );

  return sweepSeconds * 1000;
}

export function getChatExpiryCutoff(referenceDate = new Date()) {
  const expiryMinutes = getChatExpiryMinutes();
  return new Date(referenceDate.getTime() - expiryMinutes * 60_000);
}

export async function cleanupExpiredChatSessions(options?: { force?: boolean }) {
  const force = options?.force === true;
  const now = Date.now();

  if (!force && now - lastCleanupAt < getCleanupIntervalMs()) {
    return 0;
  }

  if (cleanupInFlight) {
    return cleanupInFlight;
  }

  cleanupInFlight = (async () => {
    const cutoff = getChatExpiryCutoff(new Date(now));

    const deleted = await prisma.chatSession.deleteMany({
      where: {
        updatedAt: {
          lt: cutoff,
        },
      },
    });

    lastCleanupAt = Date.now();
    return deleted.count;
  })().finally(() => {
    cleanupInFlight = null;
  });

  return cleanupInFlight;
}

export async function cleanupExpiredChatSessionsSafely(options?: { force?: boolean }) {
  try {
    return await cleanupExpiredChatSessions(options);
  } catch (error) {
    console.error("Chat cleanup failed:", error);
    return 0;
  }
}
