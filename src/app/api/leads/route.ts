import { after, NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/dashboard-auth";
import { leadMessage, newRefCode, notifyLeadBot, parseLead } from "@/src/lib/lead";
import { capiConfigured, clientIpFrom, sendCapiEvent } from "@/src/lib/meta-capi";
import { applyRequestRateLimit } from "@/src/lib/rate-limit";

const EVENT_ID = /^[A-Za-z0-9-]{8,64}$/;

/**
 * POST /api/leads: public, called by the lead form.
 * The lead is saved to the database and announced in LINE. Either one is enough
 * to call it received, so a LINE outage or a missing table does not lose a lead;
 * only when both fail does the visitor see an error.
 */
export async function POST(request: NextRequest) {
  const limited = applyRequestRateLimit(request, {
    scope: "lead-form",
    limit: 5,
    windowMs: 10 * 60 * 1000,
    message: "ส่งคำขอบ่อยเกินไป กรุณาลองใหม่อีกครั้งในอีกสักครู่",
  });
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field. Answer as if it worked.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true, refCode: newRefCode() }, { status: 201 });
  }

  const parsed = parseLead(body);
  if (!parsed.lead) {
    return NextResponse.json({ ok: false, errors: parsed.errors }, { status: 400 });
  }
  const lead = parsed.lead;
  const refCode = newRefCode();

  let savedId: string | null = null;
  try {
    const { prisma } = await import("@/src/lib/prisma");
    const row = await prisma.leadRequest.create({ data: { ...lead, refCode } });
    savedId = row.id;
  } catch (error) {
    console.error("[lead] บันทึกลงฐานข้อมูลไม่สำเร็จ:", error);
  }

  const lineSent = await notifyLeadBot(leadMessage(lead, refCode));

  if (!savedId && !lineSent) {
    return NextResponse.json(
      { ok: false, error: "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่ หรือติดต่อทาง LINE โดยตรง" },
      { status: 503 },
    );
  }

  if (savedId && lineSent) {
    const id = savedId;
    after(async () => {
      try {
        const { prisma } = await import("@/src/lib/prisma");
        await prisma.leadRequest.update({ where: { id }, data: { lineSent: true } });
      } catch (error) {
        console.error("[lead] อัปเดตสถานะการส่ง LINE ไม่สำเร็จ:", error);
      }
    });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  if (body.consent === true && EVENT_ID.test(eventId) && capiConfigured() && process.env.VERCEL_ENV === "production") {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.truefiberhome.com";
    const pagePath = lead.source && lead.source.startsWith("/") ? lead.source : "/";
    const capiEvent = {
      eventName: "Lead",
      eventId,
      eventSourceUrl: new URL(pagePath, siteUrl).toString(),
      clientIp: clientIpFrom(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip")),
      userAgent: request.headers.get("user-agent"),
      fbp: request.cookies.get("_fbp")?.value ?? null,
      fbc: request.cookies.get("_fbc")?.value ?? null,
      customData: { content_name: lead.packageName },
    };
    after(() => sendCapiEvent(capiEvent));
  }

  return NextResponse.json({ ok: true, refCode }, { status: 201 });
}

/** GET /api/leads: admin only, newest first. */
export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { prisma } = await import("@/src/lib/prisma");
    const leads = await prisma.leadRequest.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("[lead] อ่านรายการไม่สำเร็จ:", error);
    return NextResponse.json({ error: "อ่านรายการไม่สำเร็จ ตรวจว่าสร้างตาราง lead_requests แล้ว" }, { status: 500 });
  }
}
