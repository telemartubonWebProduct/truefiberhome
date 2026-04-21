import { createHash } from "crypto";
import { PUBLIC_SITE_ROUTES } from "@/src/app/sitemap";
import { lineSupport } from "@/src/context/line-path";
import { broadbandPackageData } from "@/src/data/boardband";
import { contactInfo } from "@/src/data/contact";
import { monthlyPackages } from "@/src/data/monthly";
import { promotionPackages } from "@/src/data/promotions";
import {
  knowledgeArticles as solarKnowledgeArticles,
  solarBenefits,
  solarcellPackages,
  solarNotes,
  solarProductInfo,
} from "@/src/data/solar";
import { topupPackages } from "@/src/data/topup";
import { prisma } from "@/src/lib/prisma";

const KNOWLEDGE_SNAPSHOT_ID = "current";
const DEFAULT_KNOWLEDGE_REFRESH_MINUTES = 60;
const DEFAULT_MATCHED_SECTION_LIMIT = 6;
const DEFAULT_CONTEXT_MAX_CHARS = 6000;
const MAX_INLINE_TEXT = 220;
const DEFAULT_COMPANY_NAME = "บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด";
const DEFAULT_HQ_LOCATION = "สำนักงานใหญ่ อุบลราชธานี";
const DEFAULT_HQ_COORDINATES = "15.2384, 104.8487";

const QUERY_HINTS: Array<{ pattern: RegExp; terms: string[] }> = [
  {
    pattern: /(ที่อยู่|location|address|สำนักงาน|ออฟฟิศ|บริษัท|company)/i,
    terms: ["ที่อยู่", "สำนักงาน", "บริษัท", "พิกัด", "อุบลราชธานี", "ติดต่อ"],
  },
  {
    pattern: /(มือถือ|mobile|เน็ตมือถือ|sim|เติมเงิน|topup|รายเดือน|monthly|5g|4g)/i,
    terms: ["มือถือ", "เน็ตมือถือ", "เติมเงิน", "รายเดือน", "5g", "4g", "โปรโมชันมือถือ"],
  },
  {
    pattern: /(โซล่า|โซลาร์|solar|wenergy|w&w|พลังงาน)/i,
    terms: ["โซล่าเซลล์", "solar", "w&w energy", "wenergy", "ติดตั้งโซล่า"],
  },
  {
    pattern: /(เน็ตบ้าน|fiber|broadband|ไวไฟ|wifi|internet)/i,
    terms: ["เน็ตบ้าน", "fiber", "แพ็กเกจ", "ความเร็ว", "สมัคร"],
  },
];

type KnowledgeSnapshotRecord = {
  id: string;
  hash: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type KnowledgeSection = {
  title: string;
  content: string;
  score: number;
};

let refreshInFlight: Promise<KnowledgeSnapshotRecord> | null = null;

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

function getKnowledgeRefreshIntervalMs() {
  const refreshMinutes = parsePositiveInt(
    process.env.CHAT_KNOWLEDGE_REFRESH_MINUTES,
    DEFAULT_KNOWLEDGE_REFRESH_MINUTES
  );

  return refreshMinutes * 60_000;
}

function getContextMaxChars() {
  return parsePositiveInt(process.env.CHAT_KNOWLEDGE_CONTEXT_MAX_CHARS, DEFAULT_CONTEXT_MAX_CHARS);
}

function getMatchedSectionLimit() {
  return parsePositiveInt(process.env.CHAT_KNOWLEDGE_MATCHED_SECTIONS, DEFAULT_MATCHED_SECTION_LIMIT);
}

function sanitizeInlineText(value: string | null | undefined, maxLength = MAX_INLINE_TEXT) {
  if (!value) {
    return null;
  }

  const compacted = value.replace(/\s+/g, " ").trim();
  if (compacted.length === 0) {
    return null;
  }

  return compacted.length <= maxLength ? compacted : `${compacted.slice(0, maxLength - 1)}…`;
}

function formatPrice(value: number | null | undefined, fallbackText = "ไม่ระบุ") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallbackText;
  }

  return `${new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} บาท`;
}

function parseNumericPrice(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^0-9.]/g, "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeJsonText(value: unknown): string {
  if (value === null || typeof value === "undefined") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeJsonText(item))
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .join(" | ");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        const normalizedValue = normalizeJsonText(item).trim();
        if (!normalizedValue) {
          return "";
        }

        return `${key}: ${normalizedValue}`;
      })
      .filter((item) => item.length > 0)
      .join(" | ");
  }

  return "";
}

function packageSummaryLine(item: {
  name: string;
  price: number;
  priceNote?: string | null;
  downloadSpeed?: number | null;
  uploadSpeed?: number | null;
  speedUnit?: string | null;
  contractMonths?: number | null;
  description?: string | null;
  promoBadge?: string | null;
  perks?: unknown;
  freebies?: unknown;
  buyLink?: string | null;
}) {
  const segments: string[] = [];

  segments.push(item.name);
  segments.push(`ราคา ${formatPrice(item.price)}`);

  const priceNote = sanitizeInlineText(item.priceNote ?? null);
  if (priceNote) {
    segments.push(priceNote);
  }

  if (typeof item.downloadSpeed === "number" || typeof item.uploadSpeed === "number") {
    const unit = sanitizeInlineText(item.speedUnit ?? "Mbps") || "Mbps";

    if (typeof item.downloadSpeed === "number" && typeof item.uploadSpeed === "number") {
      segments.push(`ความเร็ว ${item.downloadSpeed}/${item.uploadSpeed} ${unit}`);
    } else if (typeof item.downloadSpeed === "number") {
      segments.push(`ความเร็วดาวน์โหลด ${item.downloadSpeed} ${unit}`);
    } else if (typeof item.uploadSpeed === "number") {
      segments.push(`ความเร็วอัปโหลด ${item.uploadSpeed} ${unit}`);
    }
  }

  if (typeof item.contractMonths === "number" && item.contractMonths > 0) {
    segments.push(`สัญญา ${item.contractMonths} เดือน`);
  }

  const description = sanitizeInlineText(item.description ?? null);
  if (description) {
    segments.push(description);
  }

  const promoBadge = sanitizeInlineText(item.promoBadge ?? null);
  if (promoBadge) {
    segments.push(`โปรโมชัน ${promoBadge}`);
  }

  const perks = sanitizeInlineText(normalizeJsonText(item.perks));
  if (perks) {
    segments.push(`สิทธิพิเศษ ${perks}`);
  }

  const freebies = sanitizeInlineText(normalizeJsonText(item.freebies));
  if (freebies) {
    segments.push(`รับสิทธิ ${freebies}`);
  }

  const buyLink = sanitizeInlineText(item.buyLink ?? null);
  if (buyLink && buyLink !== "#") {
    segments.push(`ลิงก์สมัคร ${buyLink}`);
  }

  return `- ${segments.join(" | ")}`;
}

function promotionSummaryLine(item: {
  name: string;
  price: number;
  priceNote?: string | null;
  speed?: string | null;
  validity?: string | null;
  details?: unknown;
  perks?: unknown;
  promoBadge?: string | null;
  buyUrl?: string | null;
}) {
  const segments: string[] = [];

  segments.push(item.name);
  segments.push(`ราคา ${formatPrice(item.price)}`);

  const priceNote = sanitizeInlineText(item.priceNote ?? null);
  if (priceNote) {
    segments.push(priceNote);
  }

  const speed = sanitizeInlineText(item.speed ?? null);
  if (speed) {
    segments.push(`ความเร็ว ${speed}`);
  }

  const validity = sanitizeInlineText(item.validity ?? null);
  if (validity) {
    segments.push(`ระยะเวลา ${validity}`);
  }

  const promoBadge = sanitizeInlineText(item.promoBadge ?? null);
  if (promoBadge) {
    segments.push(`โปรโมชัน ${promoBadge}`);
  }

  const details = sanitizeInlineText(normalizeJsonText(item.details));
  if (details) {
    segments.push(`รายละเอียด ${details}`);
  }

  const perks = sanitizeInlineText(normalizeJsonText(item.perks));
  if (perks) {
    segments.push(`สิทธิพิเศษ ${perks}`);
  }

  const buyUrl = sanitizeInlineText(item.buyUrl ?? null);
  if (buyUrl && buyUrl !== "#") {
    segments.push(`ลิงก์สมัคร ${buyUrl}`);
  }

  return `- ${segments.join(" | ")}`;
}

function chunkLines(lines: string[]) {
  return lines
    .map((line) => sanitizeInlineText(line, 400))
    .filter((line): line is string => Boolean(line && line.length > 0));
}

async function buildWebsiteKnowledgeSnapshot(referenceDate = new Date()) {
  const [
    siteSettings,
    contactMethods,
    packageCategories,
    packages,
    promotions,
    serviceCards,
    homeSections,
    menuCategories,
    navigationItems,
    footerLinks,
  ] = await Promise.all([
    prisma.siteSettings.findFirst(),
    prisma.contactMethod.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.packageCategory.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    prisma.package.findMany({
      where: { status: true },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.promotion.findMany({
      where: { status: true },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.serviceCard.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.homeSection.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.navigationItem.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.footerLink.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  const sections: Array<{ title: string; lines: string[] }> = [];

  const contactLines: string[] = [];
  if (siteSettings) {
    const websiteDescription = sanitizeInlineText(siteSettings.description ?? null);
    if (websiteDescription) {
      contactLines.push(`- ภาพรวมบริการ: ${websiteDescription}`);
    }

    const phone = sanitizeInlineText(siteSettings.phone ?? null);
    if (phone) {
      contactLines.push(`- เบอร์ติดต่อ: ${phone}`);
    }

    const email = sanitizeInlineText(siteSettings.email ?? null);
    if (email) {
      contactLines.push(`- อีเมล: ${email}`);
    }

    const lineSupportUrl = sanitizeInlineText(siteSettings.lineSupportUrl ?? null);
    if (lineSupportUrl) {
      contactLines.push(`- ช่องทาง LINE: ${lineSupportUrl}`);
    }

    const facebookUrl = sanitizeInlineText(siteSettings.facebookUrl ?? null);
    if (facebookUrl) {
      contactLines.push(`- ช่องทาง Facebook: ${facebookUrl}`);
    }
  }

  for (const method of contactMethods) {
    const description = sanitizeInlineText(method.description ?? null);
    const href = sanitizeInlineText(method.href);
    if (!href) {
      continue;
    }

    if (description) {
      contactLines.push(`- ${method.title}: ${href} | ${description}`);
    } else {
      contactLines.push(`- ${method.title}: ${href}`);
    }
  }

  if (contactLines.length === 0) {
    contactLines.push(`- เบอร์ติดต่อ: ${contactInfo.phone}`);
    contactLines.push(`- อีเมล: ${contactInfo.email}`);

    for (const socialLink of contactInfo.socialLinks) {
      const href = sanitizeInlineText(socialLink.href);
      if (href) {
        contactLines.push(`- ${socialLink.label}: ${href}`);
      }
    }
  }

  if (!contactLines.some((line) => line.includes("LINE"))) {
    contactLines.push(`- ช่องทาง LINE: ${lineSupport}`);
  }

  contactLines.push(`- ชื่อนิติบุคคลผู้ให้บริการ: ${DEFAULT_COMPANY_NAME}`);
  contactLines.push(`- ที่อยู่บริษัท: ${DEFAULT_HQ_LOCATION}`);
  contactLines.push(`- ที่ตั้งหลัก: ${DEFAULT_HQ_LOCATION}`);
  contactLines.push(`- พิกัดแผนที่โดยประมาณ: ${DEFAULT_HQ_COORDINATES}`);

  sections.push({
    title: "ข้อมูลติดต่อและช่องทางบริการ",
    lines: chunkLines(contactLines),
  });

  sections.push({
    title: "ข้อมูลบริษัทและขอบเขตบริการ",
    lines: chunkLines([
      `- บริษัท: ${DEFAULT_COMPANY_NAME}`,
      "- ประเภทธุรกิจ: ที่ปรึกษาและผู้ให้บริการด้านเน็ตบ้าน เน็ตมือถือ และโซล่าเซลล์",
      "- หน้าข้อมูลบริษัท: /about",
      "- หน้าบริการเช็กพื้นที่/ติดต่อทีมงาน: /service",
      `- ที่อยู่บริษัทตามข้อมูลเว็บไซต์: ${DEFAULT_HQ_LOCATION}`,
      `- พื้นที่ที่ระบุบนเว็บไซต์: ${DEFAULT_HQ_LOCATION}`,
      `- พิกัดที่ระบุบนเว็บไซต์: ${DEFAULT_HQ_COORDINATES}`,
      "- เวลาทำการที่ประกาศในเว็บไซต์: จันทร์-เสาร์ 09:00 - 18:00 น.",
    ]),
  });

  const packageCategoryLines: string[] = [];
  for (const category of packageCategories) {
    if (category.items.length === 0) {
      continue;
    }

    packageCategoryLines.push(`### หมวด ${category.name}`);
    for (const item of category.items.slice(0, 30)) {
      packageCategoryLines.push(
        packageSummaryLine({
          name: item.name,
          price: item.price,
          priceNote: item.priceNote,
          downloadSpeed: item.downloadSpeed,
          uploadSpeed: item.uploadSpeed,
          speedUnit: item.speedUnit,
          contractMonths: item.contractMonths,
          description: item.description,
          promoBadge: item.promoBadge,
          perks: item.perks,
          freebies: item.freebies,
          buyLink: item.buyLink,
        })
      );
    }
  }

  if (packageCategoryLines.length > 0) {
    sections.push({
      title: "แพ็กเกจจากฐานข้อมูลเว็บไซต์",
      lines: chunkLines(packageCategoryLines),
    });
  }

  const packageLines = packages.slice(0, 60).map((item) =>
    packageSummaryLine({
      name: item.name,
      price: item.price,
      priceNote: null,
      downloadSpeed: null,
      uploadSpeed: null,
      speedUnit: item.speed,
      contractMonths: null,
      description: sanitizeInlineText(normalizeJsonText(item.details)),
      promoBadge: null,
      perks: item.freebie,
      freebies: null,
      buyLink: item.buyUrl,
    })
  );

  if (packageLines.length > 0) {
    sections.push({
      title: "แพ็กเกจรายการหลัก",
      lines: chunkLines(packageLines),
    });
  }

  const promotionLines = promotions.slice(0, 80).map((item) =>
    promotionSummaryLine({
      name: item.name,
      price: item.price,
      priceNote: item.priceNote,
      speed: item.speed,
      validity: item.validity,
      details: item.details,
      perks: item.perks,
      promoBadge: item.promoBadge,
      buyUrl: item.buyUrl,
    })
  );

  if (promotionLines.length > 0) {
    sections.push({
      title: "โปรโมชันจากเว็บไซต์",
      lines: chunkLines(promotionLines),
    });
  }

  const mobileLines: string[] = ["### โปรโมชันเน็ตมือถือ"];

  for (const item of promotionPackages.filter((pkg) => pkg.category_id === 2).slice(0, 20)) {
    mobileLines.push(
      packageSummaryLine({
        name: item.name,
        price: item.price,
        priceNote: item.price_note,
        downloadSpeed: item.download_speed,
        uploadSpeed: item.upload_speed,
        speedUnit: item.speed_unit,
        contractMonths: item.contract_months,
        description: item.description,
        promoBadge: item.promo_badge,
        perks: item.perks,
        freebies: item.freebies,
        buyLink: item.buy_link,
      })
    );
  }

  mobileLines.push("### แพ็กเกจรายเดือน");
  for (const item of monthlyPackages.slice(0, 20)) {
    mobileLines.push(
      packageSummaryLine({
        name: item.name,
        price: item.price,
        priceNote: item.price_note,
        downloadSpeed: item.download_speed,
        uploadSpeed: item.upload_speed,
        speedUnit: item.speed_unit,
        contractMonths: item.contract_months,
        description: item.description,
        promoBadge: item.promo_badge,
        perks: item.perks,
        freebies: item.freebies,
        buyLink: item.buy_link,
      })
    );
  }

  mobileLines.push("### แพ็กเกจเติมเงิน");
  for (const item of topupPackages.slice(0, 20)) {
    mobileLines.push(
      packageSummaryLine({
        name: item.name,
        price: item.price,
        priceNote: item.price_note,
        downloadSpeed: item.download_speed,
        uploadSpeed: item.upload_speed,
        speedUnit: item.speed_unit,
        contractMonths: item.contract_months,
        description: item.description,
        promoBadge: item.promo_badge,
        perks: item.perks,
        freebies: item.freebies,
        buyLink: item.buy_link,
      })
    );
  }

  sections.push({
    title: "บริการเน็ตมือถือ รายเดือน และเติมเงิน",
    lines: chunkLines(mobileLines),
  });

  const solarLines: string[] = [
    "- หน้าบริการโซล่าเซลล์: /wEnergy",
    `- ${solarProductInfo.title} | ${solarProductInfo.subtitle} | ติดต่อ ${solarProductInfo.contactPhone}`,
  ];

  const solarDescription = sanitizeInlineText(solarProductInfo.description, 360);
  if (solarDescription) {
    solarLines.push(`- รายละเอียดบริการโซล่าเซลล์: ${solarDescription}`);
  }

  solarLines.push("### แพ็กเกจโซล่าเซลล์");
  for (const item of solarcellPackages.slice(0, 12)) {
    const packagePrice = parseNumericPrice(item.price);
    const packageOldPrice = parseNumericPrice(item.discount_price);
    const segments = [
      `${item.title} (${item.pack})`,
      `ราคา ${formatPrice(packagePrice)}`,
    ];

    if (packageOldPrice && (!packagePrice || packageOldPrice > packagePrice)) {
      segments.push(`ราคาปกติ ${formatPrice(packageOldPrice)}`);
    }

    const description = sanitizeInlineText(item.description);
    const panel = sanitizeInlineText(item.solarcell);
    const area = sanitizeInlineText(item.arae);
    const scope = sanitizeInlineText(item.scope);
    const guarantee = sanitizeInlineText(item.karantee);

    if (description) {
      segments.push(description);
    }
    if (panel) {
      segments.push(panel);
    }
    if (area) {
      segments.push(area);
    }
    if (scope) {
      segments.push(scope);
    }
    if (guarantee) {
      segments.push(guarantee);
    }

    solarLines.push(`- ${segments.join(" | ")}`);
  }

  if (solarBenefits.length > 0) {
    solarLines.push("### สิทธิประโยชน์โซล่าเซลล์");
    for (const benefit of solarBenefits.slice(0, 10)) {
      const benefitText = sanitizeInlineText(benefit.text);
      if (benefitText) {
        solarLines.push(`- ${benefitText}`);
      }
    }
  }

  if (solarNotes.length > 0) {
    solarLines.push("### หมายเหตุโซล่าเซลล์");
    for (const note of solarNotes.slice(0, 8)) {
      const noteText = sanitizeInlineText(note);
      if (noteText) {
        solarLines.push(`- ${noteText}`);
      }
    }
  }

  if (solarKnowledgeArticles.length > 0) {
    solarLines.push("### ความรู้ก่อนติดตั้งโซล่าเซลล์");
    for (const article of solarKnowledgeArticles.slice(0, 6)) {
      const title = sanitizeInlineText(article.title);
      const excerpt = sanitizeInlineText(article.content, 180);

      if (title && excerpt) {
        solarLines.push(`- ${title}: ${excerpt}`);
      } else if (title) {
        solarLines.push(`- ${title}`);
      }
    }
  }

  sections.push({
    title: "บริการโซล่าเซลล์ W&W Energy",
    lines: chunkLines(solarLines),
  });

  const serviceLines = serviceCards.map((item) => {
    const details = sanitizeInlineText(item.detail);
    if (details) {
      return `- ${item.title} | ${details} | ลิงก์ ${item.path}`;
    }

    return `- ${item.title} | ลิงก์ ${item.path}`;
  });

  if (serviceLines.length > 0) {
    sections.push({
      title: "บริการหลักของเว็บไซต์",
      lines: chunkLines(serviceLines),
    });
  }

  const homeSectionLines = homeSections.map((section) => {
    const title = sanitizeInlineText(section.title);
    const subtitle = sanitizeInlineText(section.subtitle);
    const jsonData = sanitizeInlineText(normalizeJsonText(section.jsonData), 260);

    const base = [`- sectionKey ${section.sectionKey}`];

    if (title) {
      base.push(`title ${title}`);
    }

    if (subtitle) {
      base.push(`subtitle ${subtitle}`);
    }

    if (jsonData) {
      base.push(`json ${jsonData}`);
    }

    return base.join(" | ");
  });

  if (homeSectionLines.length > 0) {
    sections.push({
      title: "คอนเทนต์หน้าเว็บ",
      lines: chunkLines(homeSectionLines),
    });
  }

  const navigationLines: string[] = [];

  for (const category of menuCategories) {
    navigationLines.push(`- เมนูหลัก ${category.text} | path ${category.path}`);
  }

  for (const item of navigationItems) {
    navigationLines.push(`- เมนูย่อย ${item.label} | path ${item.path}`);
  }

  for (const item of footerLinks) {
    navigationLines.push(`- ลิงก์ท้ายเว็บ ${item.label} | path ${item.path}`);
  }

  if (navigationLines.length > 0) {
    sections.push({
      title: "เส้นทางเมนูและหน้าบนเว็บไซต์",
      lines: chunkLines(navigationLines),
    });
  }

  sections.push({
    title: "รายการหน้าสาธารณะของเว็บไซต์",
    lines: chunkLines(
      PUBLIC_SITE_ROUTES.map((path) => {
        if (path === "/home") {
          return "- หน้าแรก | path /home";
        }

        return `- หน้า ${path.replace(/^\//, "")} | path ${path}`;
      })
    ),
  });

  const fallbackPackages = [
    ...broadbandPackageData.slice(0, 8),
    ...monthlyPackages.slice(0, 8),
    ...topupPackages.slice(0, 8),
    ...promotionPackages.slice(0, 8),
  ];

  const fallbackLines = fallbackPackages.map((item) =>
    packageSummaryLine({
      name: item.name,
      price: item.price,
      priceNote: item.price_note,
      downloadSpeed: item.download_speed,
      uploadSpeed: item.upload_speed,
      speedUnit: item.speed_unit,
      contractMonths: item.contract_months,
      description: item.description,
      promoBadge: item.promo_badge,
      perks: item.perks,
      freebies: item.freebies,
      buyLink: item.buy_link,
    })
  );

  sections.push({
    title: "แพ็กเกจสำรองจากข้อมูลเว็บ",
    lines: chunkLines(fallbackLines),
  });

  const header = [
    "# True Fiber Home Knowledge Snapshot",
    `- generated_at: ${referenceDate.toISOString()}`,
    "- policy: ใช้ตอบลูกค้าเฉพาะข้อมูลที่อยู่ใน snapshot นี้เท่านั้น",
  ];

  const sectionBlocks = sections
    .filter((section) => section.lines.length > 0)
    .map((section) => `## ${section.title}\n${section.lines.join("\n")}`);

  return `${header.join("\n")}\n\n${sectionBlocks.join("\n\n")}`.trim();
}

function splitKnowledgeSections(content: string) {
  const sections: KnowledgeSection[] = [];
  const matches = content.matchAll(/^##\s+(.+)$/gm);
  const indexes = Array.from(matches).map((match) => ({
    title: match[1].trim(),
    index: match.index ?? 0,
  }));

  if (indexes.length === 0) {
    return sections;
  }

  for (let index = 0; index < indexes.length; index += 1) {
    const current = indexes[index];
    const next = indexes[index + 1];

    const block = content.slice(current.index, next ? next.index : content.length).trim();
    const blockContent = block.replace(/^##\s+.+\n?/, "").trim();

    sections.push({
      title: current.title,
      content: blockContent,
      score: 0,
    });
  }

  return sections;
}

function extractQueryTerms(question: string) {
  const lowered = question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();

  const tokens = lowered
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  const deduped = Array.from(new Set(tokens));

  if (lowered.length >= 3 && !deduped.includes(lowered)) {
    deduped.unshift(lowered);
  }

  for (const hint of QUERY_HINTS) {
    if (!hint.pattern.test(lowered)) {
      continue;
    }

    for (const term of hint.terms) {
      if (!deduped.includes(term)) {
        deduped.push(term);
      }
    }
  }

  return deduped.slice(0, 32);
}

function clampSectionsByChars(sections: KnowledgeSection[], maxChars: number) {
  const selected: KnowledgeSection[] = [];
  let usedChars = 0;

  for (const section of sections) {
    const block = `## ${section.title}\n${section.content}`;
    if (block.length > maxChars && selected.length === 0) {
      selected.push({
        ...section,
        content: section.content.slice(0, Math.max(800, maxChars - section.title.length - 8)),
      });
      break;
    }

    if (usedChars + block.length > maxChars) {
      continue;
    }

    selected.push(section);
    usedChars += block.length;
  }

  return selected;
}

function getFocusedKnowledgeContext(snapshotContent: string, question: string) {
  const sections = splitKnowledgeSections(snapshotContent);
  if (sections.length === 0) {
    return {
      context: null,
      sectionTitles: [] as string[],
    };
  }

  const terms = extractQueryTerms(question);
  const scored = sections.map((section) => {
    const haystack = `${section.title}\n${section.content}`.toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (!haystack.includes(term)) {
        continue;
      }

      score += term.length >= 5 ? 4 : 2;
      if (section.title.toLowerCase().includes(term)) {
        score += 4;
      }
    }

    return {
      ...section,
      score,
    };
  });

  const ranked = scored
    .slice()
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));

  const positive = ranked.filter((section) => section.score > 0).slice(0, getMatchedSectionLimit());
  const fallbackSections = ranked.slice(0, Math.min(5, ranked.length));
  const source = positive.length > 0 ? positive : fallbackSections;
  const limited = clampSectionsByChars(source, getContextMaxChars());

  if (limited.length === 0) {
    return {
      context: null,
      sectionTitles: [] as string[],
    };
  }

  return {
    context: limited.map((section) => `## ${section.title}\n${section.content}`).join("\n\n").trim(),
    sectionTitles: limited.map((section) => section.title),
  };
}

async function readKnowledgeSnapshot() {
  return prisma.knowledgeSnapshot.findUnique({
    where: { id: KNOWLEDGE_SNAPSHOT_ID },
    select: {
      id: true,
      hash: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function refreshKnowledgeSnapshot(options?: { force?: boolean }) {
  const forceRefresh = options?.force === true;

  if (!forceRefresh) {
    const current = await readKnowledgeSnapshot();
    if (current && Date.now() - current.updatedAt.getTime() < getKnowledgeRefreshIntervalMs()) {
      return current;
    }
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const nextContent = await buildWebsiteKnowledgeSnapshot(new Date());
    const nextHash = createHash("sha256").update(nextContent).digest("hex");

    const snapshot = await prisma.knowledgeSnapshot.upsert({
      where: {
        id: KNOWLEDGE_SNAPSHOT_ID,
      },
      create: {
        id: KNOWLEDGE_SNAPSHOT_ID,
        hash: nextHash,
        content: nextContent,
      },
      update: {
        hash: nextHash,
        content: nextContent,
      },
      select: {
        id: true,
        hash: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return snapshot;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export async function refreshKnowledgeSnapshotSafely(options?: { force?: boolean }) {
  try {
    return await refreshKnowledgeSnapshot(options);
  } catch (error) {
    console.error("Failed to refresh knowledge snapshot:", error);
    return null;
  }
}

export async function getKnowledgeContextForQuestion(question: string) {
  const snapshot = await refreshKnowledgeSnapshotSafely();

  if (!snapshot || !snapshot.content || snapshot.content.trim().length === 0) {
    return {
      context: null,
      sectionTitles: [] as string[],
      snapshotMeta: null,
    };
  }

  const focused = getFocusedKnowledgeContext(snapshot.content, question);

  return {
    context: focused.context,
    sectionTitles: focused.sectionTitles,
    snapshotMeta: {
      id: snapshot.id,
      hash: snapshot.hash,
      updatedAt: snapshot.updatedAt,
      contentLength: snapshot.content.length,
    },
  };
}

export async function getKnowledgeSnapshotStatus() {
  const snapshot = await readKnowledgeSnapshot();

  if (!snapshot) {
    return {
      exists: false,
      id: KNOWLEDGE_SNAPSHOT_ID,
      updatedAt: null,
      createdAt: null,
      hash: null,
      contentLength: 0,
    };
  }

  return {
    exists: true,
    id: snapshot.id,
    updatedAt: snapshot.updatedAt,
    createdAt: snapshot.createdAt,
    hash: snapshot.hash,
    contentLength: snapshot.content.length,
  };
}
