import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { lineSupport } from "@/src/context/line-path";

export const metadata: Metadata = {
  title: "บริการของเรา",
  description:
    "บริการตรวจสอบพื้นที่ ติดตั้งอินเทอร์เน็ต และดูแลหลังการขายโดยทีมงานมืออาชีพ พร้อมขั้นตอนชัดเจน",
  alternates: { canonical: "/service" },
};

type ServiceSection = {
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  jsonData?: unknown;
  isActive: boolean;
};

type ContactCardType = "phone" | "line" | "facebook" | "location";

function ContactCardIcon({ type }: { type: ContactCardType }) {
  if (type === "facebook") {
    return (
      <span className="text-sm font-black leading-none" aria-hidden>
        f
      </span>
    );
  }

  if (type === "line") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.4 8.4 0 01-8.4 8.4H12l-4 2 1.2-3.6A8.4 8.4 0 1112 19.9" />
      </svg>
    );
  }

  if (type === "location") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-5.33-6-10a6 6 0 1112 0c0 4.67-6 10-6 10z" />
        <circle cx="12" cy="11" r="2.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2A19.86 19.86 0 012 4.18 2 2 0 014 2h3a2 2 0 012 1.72c.12.9.33 1.77.62 2.6a2 2 0 01-.45 2.11L8.1 9.9a16 16 0 006 6l1.47-1.17a2 2 0 012.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0122 16.92z" />
    </svg>
  );
}

function normalizeHref(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/service" || trimmed === "#") {
    return fallback;
  }
  return trimmed;
}

function extractEmbedSrc(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("<")) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    return srcMatch?.[1]?.trim() || "";
  }

  return trimmed;
}

function buildEmbedFromQuery(query: string) {
  if (!query.trim()) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function resolveMapEmbedUrl(inputEmbedUrl: string, inputLocationUrl: string, mapCoordinates: string, locationLabel: string) {
  const embedCandidate = extractEmbedSrc(inputEmbedUrl) || normalizeHref(inputLocationUrl, "");
  const fallbackQuery = mapCoordinates.trim() || locationLabel.trim();

  if (!embedCandidate) {
    return buildEmbedFromQuery(fallbackQuery);
  }

  const lower = embedCandidate.toLowerCase();
  const isGoogleMapsLink =
    lower.includes("google.com/maps") ||
    lower.includes("maps.google.com") ||
    lower.includes("maps.app.goo.gl") ||
    lower.includes("goo.gl/maps");
  const isAlreadyEmbeddable = lower.includes("/maps/embed") || lower.includes("output=embed");

  if (isGoogleMapsLink && !isAlreadyEmbeddable) {
    return buildEmbedFromQuery(fallbackQuery);
  }

  return embedCandidate;
}

function parseJsonData(jsonData: unknown) {
  const defaults = {
    topCtaLabel: "เช็กพื้นที่บริการติดตั้ง/ย้ายจุด",
    topCtaHref: lineSupport,
    phone: "0910192552",
    lineUrl: lineSupport,
    facebookUrl: "",
    locationLabel: "สำนักงานใหญ่ อุบลราชธานี",
    locationUrl: "",
    mapEmbedUrl: "",
    mapCoordinates: "15.2384, 104.8487",
    aboutTitle: "เกี่ยวกับบริการของเรา",
    aboutDescription:
      "เราให้บริการตั้งแต่การให้คำปรึกษา ตรวจสอบพื้นที่ เลือกแพ็กเกจที่เหมาะสม ไปจนถึงติดตั้งและดูแลหลังการขาย",
    contactNote:
      "ทีมงานพร้อมดูแลทั้งการติดตั้งใหม่และย้ายจุดใช้งาน พร้อมแจ้งเงื่อนไขบริการอย่างชัดเจน",
  };

  if (!jsonData || typeof jsonData !== "object" || Array.isArray(jsonData)) {
    return defaults;
  }

  const data = jsonData as Record<string, unknown>;
  const topCtaHref = normalizeHref(data.topCtaHref, defaults.topCtaHref);
  const lineUrl = normalizeHref(data.lineUrl, defaults.lineUrl);
  const facebookUrl = normalizeHref(data.facebookUrl, "");
  const locationUrl = normalizeHref(data.locationUrl, "");
  const mapEmbedUrl = extractEmbedSrc(data.mapEmbedUrl);

  return {
    topCtaLabel: typeof data.topCtaLabel === "string" ? data.topCtaLabel : defaults.topCtaLabel,
    topCtaHref,
    phone: typeof data.phone === "string" ? data.phone : defaults.phone,
    lineUrl,
    facebookUrl,
    locationLabel: typeof data.locationLabel === "string" ? data.locationLabel : defaults.locationLabel,
    locationUrl,
    mapEmbedUrl,
    mapCoordinates: typeof data.mapCoordinates === "string" ? data.mapCoordinates : defaults.mapCoordinates,
    aboutTitle: typeof data.aboutTitle === "string" ? data.aboutTitle : defaults.aboutTitle,
    aboutDescription: typeof data.aboutDescription === "string" ? data.aboutDescription : defaults.aboutDescription,
    contactNote: typeof data.contactNote === "string" ? data.contactNote : defaults.contactNote,
  };
}

export default async function ServicePage() {
  const homeSectionDelegate = (prisma as any).homeSection;

  const serviceSection: ServiceSection | null = homeSectionDelegate
    ? await homeSectionDelegate.findUnique({ where: { sectionKey: "servicePageContent" } })
    : null;

  const jsonData = parseJsonData(serviceSection?.jsonData);

  const title = serviceSection?.title || "บริการเช็กพื้นที่ ติดตั้ง และย้ายจุด";
  const subtitle =
    serviceSection?.subtitle ||
    "ตรวจสอบพิกัดพื้นที่บริการและนัดหมายติดตั้งได้รวดเร็ว พร้อมทีมงานมืออาชีพดูแลทุกขั้นตอน";
  const heroImage = serviceSection?.imageUrl || "/assets/Trueonline-logo.svg.png";
  const detailImage = serviceSection?.linkUrl || heroImage;
  const contactHref = normalizeHref(jsonData.topCtaHref, lineSupport);
  const lineHref = normalizeHref(jsonData.lineUrl, contactHref);
  const facebookHref = normalizeHref(jsonData.facebookUrl, contactHref);
  const locationHref = normalizeHref(jsonData.locationUrl, contactHref);
  const mapEmbedUrl = resolveMapEmbedUrl(
    jsonData.mapEmbedUrl,
    jsonData.locationUrl,
    jsonData.mapCoordinates,
    jsonData.locationLabel
  );

  const contactCards = [
    {
      label: "โทรหาเรา",
      value: jsonData.phone,
      subText: "ติดต่อเจ้าหน้าที่ได้ทันที",
      href: `tel:${jsonData.phone.replace(/[^0-9+]/g, "")}`,
      type: "phone" as ContactCardType,
    },
    {
      label: "Line",
      value: "แชตผ่าน LINE",
      subText: lineHref.replace(/^https?:\/\/(www\.)?/i, ""),
      href: lineHref,
      type: "line" as ContactCardType,
    },
    {
      label: "Facebook",
      value: "ติดต่อผ่าน Facebook",
      subText: facebookHref.replace(/^https?:\/\/(www\.)?/i, ""),
      href: facebookHref,
      type: "facebook" as ContactCardType,
    },
    {
      label: "พิกัดที่ตั้ง",
      value: jsonData.locationLabel,
      subText: `Coordinates: ${jsonData.mapCoordinates}`,
      href: locationHref,
      type: "location" as ContactCardType,
    },
  ];

  const processSteps = [
    "แจ้งพื้นที่และความต้องการใช้งาน",
    "ทีมงานตรวจสอบจุดติดตั้ง/ย้ายจุดและแนะนำแพ็กเกจ",
    "นัดหมายวันเวลาเข้าดำเนินการ",
    "ติดตั้งและทดสอบสัญญาณ พร้อมดูแลหลังการขาย",
  ];

  return (
    <main className="bg-slate-50 min-h-screen pb-20 pt-28">
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl bg-gradient-to-br from-[#0f3ab8] via-[#2c57e0] to-[#5d7eff] text-white p-6 md:p-10 shadow-[0_25px_70px_rgba(26,73,216,0.25)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/80">service point check</p>
              <h1 className="mt-2 text-3xl md:text-5xl font-black leading-tight">{title}</h1>
              <p className="mt-4 text-sm md:text-base text-white/90 leading-7">{subtitle}</p>

              <Link
                href={contactHref}
                className="inline-flex mt-6 rounded-xl bg-white text-[#1a3fb8] px-5 py-2.5 font-bold hover:bg-slate-100 transition-colors"
              >
                {jsonData.topCtaLabel}
              </Link>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm">
              <img src={heroImage} alt="Service hero" className="h-[260px] md:h-[320px] w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {contactCards.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                  <ContactCardIcon type={item.type} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                  <p className="mt-1 text-base font-bold text-slate-900 break-words">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500 break-words">{item.subText}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
        <p className="mt-4 text-slate-600 text-sm md:text-base">{jsonData.contactNote}</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">about service</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">{jsonData.aboutTitle}</h2>
            <p className="mt-3 text-slate-700 leading-7">{jsonData.aboutDescription}</p>

            <h3 className="mt-6 text-lg font-bold text-slate-900">ขั้นตอนการให้บริการ</h3>
            <ol className="mt-3 list-decimal pl-6 text-slate-700 space-y-2">
              {processSteps.map((step, index) => (
                <li key={`step-${index}`}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
            <img src={detailImage} alt="Service detail" className="h-full min-h-[360px] w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 mt-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <ContactCardIcon type="location" />
            </span>
            พิกัดและพื้นที่ให้บริการ
          </h2>
          <p className="mt-2 text-slate-700">{jsonData.locationLabel}</p>
          <p className="text-slate-500 text-sm">Coordinates: {jsonData.mapCoordinates}</p>

          {mapEmbedUrl && mapEmbedUrl.startsWith("http") ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="360"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Service Location Map"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-slate-600">
              ยังไม่ได้ตั้งค่าแผนที่ Embed สามารถใส่ลิงก์แผนที่ได้จาก Dashboard
            </div>
          )}

          <div className="mt-4">
            <Link
              href={locationHref}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1f4cdc] px-5 py-2.5 text-white font-semibold hover:bg-[#183fb5] transition-colors"
            >
              <ContactCardIcon type="location" />
              เปิดแผนที่และเช็กพิกัด
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
