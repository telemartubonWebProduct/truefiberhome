import { cache } from "react";
import { parsePhones } from "@/src/lib/site";

const FALLBACK_PHONE = "0639274977";

/** Contact numbers from site settings, with a fallback when the database is unreachable. */
export const getSitePhones = cache(async (): Promise<string[]> => {
  try {
    const { prisma } = await import("@/src/lib/prisma");
    const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    const phones = parsePhones(settings?.phone);
    return phones.length > 0 ? phones : [FALLBACK_PHONE];
  } catch {
    return [FALLBACK_PHONE];
  }
});
