/**
 * Install requests from the site's lead form: validation, the reference code,
 * and the notification sent through the lead bot's LINE channel.
 *
 * The lead bot is its own Messaging API channel, separate from the report bot
 * (LINE_CHANNEL_ACCESS_TOKEN). It stays off until both variables are set:
 *   LINE_LEAD_CHANNEL_ACCESS_TOKEN  channel access token of the lead bot
 *   LINE_LEAD_TARGET_ID             user id or group id to notify; several, comma separated
 */

/** Where customers add the shop on LINE after sending the form. */
export const LINE_ADD_FRIEND_URL = "https://line.me/R/ti/p/@594wrbvr?ts=09071721&oat_content=url";

export type LeadInput = {
  fullName: string;
  phone: string;
  packageName: string;
  packageInfo: string | null;
  latitude: number | null;
  longitude: number | null;
  addressNote: string | null;
  source: string | null;
};

export type LeadErrors = Partial<Record<"fullName" | "phone" | "packageName" | "location", string>>;

const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Thai numbers: 9 or 10 digits starting with 0. "+66" and separators are accepted and normalized. */
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let digits = value.replace(/[^\d+]/g, "");
  if (digits.startsWith("+66")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("66") && digits.length === 11) digits = `0${digits.slice(2)}`;
  digits = digits.replace(/\D/g, "");
  return /^0\d{8,9}$/.test(digits) ? digits : null;
}

const coordinate = (value: unknown, limit: number): number | null => {
  const number = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(number) && Math.abs(number) <= limit ? Number(number.toFixed(6)) : null;
};

/** Reads an untrusted request body. Returns either the cleaned lead or the field errors. */
export function parseLead(body: unknown): { lead: LeadInput; errors: null } | { lead: null; errors: LeadErrors } {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: LeadErrors = {};

  const fullName = text(data.fullName, 80);
  if (fullName.length < 2) errors.fullName = "กรุณากรอกชื่อ";

  const phone = normalizePhone(data.phone);
  if (!phone) errors.phone = "กรุณากรอกเบอร์โทร 9 ถึง 10 หลัก";

  const packageName = text(data.packageName, 120);
  if (!packageName) errors.packageName = "กรุณาเลือกโปร";

  const latitude = coordinate(data.latitude, 90);
  const longitude = coordinate(data.longitude, 180);
  const hasPin = latitude !== null && longitude !== null;
  const addressNote = text(data.addressNote, 300) || null;
  if (!hasPin && (addressNote?.length ?? 0) < 5) {
    errors.location = "กรุณาปักหมุดบนแผนที่ หรือพิมพ์ที่อยู่ติดตั้ง";
  }

  if (Object.keys(errors).length > 0 || !phone) return { lead: null, errors };

  return {
    lead: {
      fullName,
      phone,
      packageName,
      packageInfo: text(data.packageInfo, 300) || null,
      latitude: hasPin ? latitude : null,
      longitude: hasPin ? longitude : null,
      addressNote,
      source: text(data.source, 60) || null,
    },
    errors: null,
  };
}

/** "TF-4821": short enough to type in a chat. Not unique by design; the row id is. */
export function newRefCode(): string {
  return `TF-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function mapsLink(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function leadMessage(lead: LeadInput, refCode: string): string {
  const lines = [
    `ลูกค้าสนใจติดเน็ตบ้าน (${refCode})`,
    "",
    `โปรที่สนใจ: ${lead.packageName}`,
    lead.packageInfo ? `รายละเอียด: ${lead.packageInfo}` : null,
    `ชื่อ: ${lead.fullName}`,
    `เบอร์โทร: ${lead.phone}`,
    lead.latitude !== null && lead.longitude !== null
      ? `พิกัดติดตั้ง: ${mapsLink(lead.latitude, lead.longitude)}`
      : null,
    lead.addressNote ? `ที่อยู่หรือจุดสังเกต: ${lead.addressNote}` : null,
    lead.source ? `มาจากหน้า: ${lead.source}` : null,
  ];
  return lines.filter((line): line is string => line !== null).join("\n");
}

const env = (name: string) => (process.env[name] ?? "").trim().replace(/^['"]|['"]$/g, "");

export function leadBotConfigured(): boolean {
  return Boolean(env("LINE_LEAD_CHANNEL_ACCESS_TOKEN") && env("LINE_LEAD_TARGET_ID"));
}

/** Pushes the message to every configured target. True when at least one push was accepted. */
export async function notifyLeadBot(message: string): Promise<boolean> {
  const token = env("LINE_LEAD_CHANNEL_ACCESS_TOKEN");
  const targets = env("LINE_LEAD_TARGET_ID")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!token || targets.length === 0) return false;

  const results = await Promise.all(
    targets.map(async (to) => {
      try {
        const response = await fetch("https://api.line.me/v2/bot/message/push", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ to, messages: [{ type: "text", text: message }] }),
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
          console.error("[lead] LINE ตอบกลับไม่สำเร็จ:", response.status, await response.text().catch(() => ""));
        }
        return response.ok;
      } catch (error) {
        console.error("[lead] ส่งเข้า LINE ไม่สำเร็จ:", error);
        return false;
      }
    }),
  );
  return results.some(Boolean);
}
