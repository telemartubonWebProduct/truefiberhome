import { leadBotConfigured, mapsLink } from "@/src/lib/lead";
import { formatPhone, telHref } from "@/src/lib/site";

export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  refCode: string;
  fullName: string;
  phone: string;
  packageName: string;
  packageInfo: string | null;
  latitude: number | null;
  longitude: number | null;
  addressNote: string | null;
  source: string | null;
  lineSent: boolean;
  createdAt: Date;
};

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(value);

async function loadLeads(): Promise<{ leads: LeadRow[]; error: string | null }> {
  try {
    const { prisma } = await import("@/src/lib/prisma");
    const leads = await prisma.leadRequest.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return { leads, error: null };
  } catch (error) {
    console.error("[dashboard/leads] อ่านรายการไม่สำเร็จ:", error);
    return { leads: [], error: "อ่านรายการไม่สำเร็จ ตรวจว่าสร้างตาราง lead_requests ในฐานข้อมูลแล้ว (ไฟล์ prisma/lead-requests.sql)" };
  }
}

/** Install requests from the site's lead form, newest first. Auth comes from the dashboard layout. */
export default async function LeadsPage() {
  const { leads, error } = await loadLeads();
  const botOn = leadBotConfigured();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-slate-900">ลูกค้าที่กรอกฟอร์ม</h1>
      <p className="mt-1 text-sm text-slate-600">
        รายการจากฟอร์มเช็กพื้นที่ติดตั้งบนหน้าเว็บ ล่าสุดอยู่บนสุด แสดงสูงสุด 200 รายการ
      </p>

      {!botOn && (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ยังไม่ได้ตั้งค่าบอต LINE สำหรับแจ้งลูกค้าใหม่ (LINE_LEAD_CHANNEL_ACCESS_TOKEN และ LINE_LEAD_TARGET_ID)
          ระหว่างนี้รายการจะเข้ามาที่หน้านี้อย่างเดียว
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {!error && leads.length === 0 && <p className="mt-8 text-slate-500">ยังไม่มีรายการ</p>}

      {leads.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">เวลา</th>
                <th className="px-4 py-3 font-semibold">รหัส</th>
                <th className="px-4 py-3 font-semibold">ชื่อและเบอร์โทร</th>
                <th className="px-4 py-3 font-semibold">โปรที่สนใจ</th>
                <th className="px-4 py-3 font-semibold">ตำแหน่งติดตั้ง</th>
                <th className="px-4 py-3 font-semibold">LINE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(lead.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{lead.refCode}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{lead.fullName}</div>
                    <a className="text-blue-700 underline" href={telHref(lead.phone)}>
                      {formatPhone(lead.phone)}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{lead.packageName}</div>
                    {lead.packageInfo && <div className="text-slate-500">{lead.packageInfo}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {lead.latitude !== null && lead.longitude !== null && (
                      <a
                        className="text-blue-700 underline"
                        href={mapsLink(lead.latitude, lead.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        เปิดใน Google Maps
                      </a>
                    )}
                    {lead.addressNote && <div className="text-slate-600">{lead.addressNote}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {lead.lineSent ? (
                      <span className="text-emerald-700">ส่งแล้ว</span>
                    ) : (
                      <span className="text-slate-400">ยังไม่ได้ส่ง</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
