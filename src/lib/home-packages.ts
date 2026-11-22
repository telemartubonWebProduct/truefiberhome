import { lineSupport } from "@/src/context/line-path";
import { safeLink } from "@/src/lib/api-normalize";

export type HomeArt = "net" | "movie" | "cctv" | "mesh" | "game";

export type HomePackage = {
  id: string;
  name: string;
  category: string;
  art: HomeArt;
  /** Download speed in Mbps, when it can be read from the speed text. */
  down: number | null;
  speedLabel: string | null;
  price: number;
  termLabel: string | null;
  perks: string[];
  buyUrl: string;
  hot: boolean;
};

type Draft = Omit<HomePackage, "hot" | "buyUrl" | "art"> & { buyUrl?: string | null };

function pickArt(item: Draft): HomeArt {
  const text = `${item.name} ${item.category} ${item.perks.join(" ")}`.toLowerCase();
  if (/cctv|กล้อง/.test(text)) return "cctv";
  if (/mesh/.test(text)) return "mesh";
  if (/netflix|youtube|now ent|nowent|iqiyi|ดูหนัง|ซีรีส์|series/.test(text)) return "movie";
  if ((item.down ?? 0) >= 1000) return "game";
  return "net";
}

function finalize(items: Draft[]): HomePackage[] {
  const lowest = items.reduce((min, item) => Math.min(min, item.price), Number.POSITIVE_INFINITY);
  let hotAssigned = false;

  // The CMS often reuses one name ("โปรเน็ตบ้าน") for several speeds. Cards and
  // structured data need distinct names, so repeated names get their speed appended.
  const nameCount = new Map<string, number>();
  items.forEach((item) => nameCount.set(item.name, (nameCount.get(item.name) ?? 0) + 1));
  items = items.map((item) =>
    (nameCount.get(item.name) ?? 0) > 1 && item.speedLabel
      ? { ...item, name: `${item.name} ${item.speedLabel}` }
      : item,
  );

  return items.map((item) => {
    const hot = !hotAssigned && item.price === lowest;
    if (hot) hotAssigned = true;
    const link = typeof item.buyUrl === "string" ? item.buyUrl.trim() : "";
    const usable = link && link !== "#" && link !== "/service" ? safeLink(link) : null;

    return { ...item, art: pickArt(item), buyUrl: usable || lineSupport, hot };
  });
}

const fallback = (
  id: string,
  category: string,
  name: string,
  down: number,
  up: number,
  price: number,
  months: number,
  perks: string[],
): Draft => ({
  id,
  category,
  name,
  down,
  speedLabel: `${down}/${up} Mbps`,
  price,
  termLabel: `สัญญา ${months} เดือน`,
  perks,
});

export const FALLBACK_PACKAGES: HomePackage[] = finalize([
  fallback("start", "เน็ตอย่างเดียว", "เน็ตบ้านทรู 500/500", 500, 500, 499, 24, ["เราเตอร์ WiFi 6"]),
  fallback("yt", "ดูหนัง ซีรีส์", "เน็ตบ้าน + YouTube Premium", 500, 500, 799, 24, ["เราเตอร์ WiFi 6", "YouTube Premium", "iQIYI"]),
  fallback("g24", "เน็ตอย่างเดียว", "เน็ตบ้านทรู 1000/1000", 1000, 1000, 759, 24, ["เราเตอร์ WiFi 6", "อัปโหลดเต็ม 1000 Mbps"]),
  fallback("nf", "ดูหนัง ซีรีส์", "เน็ตบ้าน + Netflix", 500, 500, 899, 24, ["เราเตอร์ WiFi 6", "Netflix", "iQIYI และ TrueID+"]),
  fallback("cctv1", "กล้อง CCTV", "เน็ตบ้าน + CCTV 1 ตัว", 500, 500, 598, 24, ["เราเตอร์ WiFi 6", "กล้อง CCTV 1 ตัว"]),
  fallback("mesh", "Mesh WiFi", "เน็ตบ้าน + Mesh WiFi", 500, 500, 599, 24, ["เราเตอร์ WiFi 6", "Mesh WiFi ขยายสัญญาณ"]),
  fallback("g12", "เน็ตอย่างเดียว", "เน็ตบ้านทรู 1000/500", 1000, 500, 699, 12, ["เราเตอร์ WiFi 6", "สัญญาสั้น 12 เดือน"]),
  fallback("now", "ดูหนัง ซีรีส์", "เน็ตบ้าน + NOW ENT", 500, 500, 600, 24, ["เราเตอร์ WiFi 6", "NOW ENT", "กล่อง TrueID Gen2"]),
  fallback("cctv2", "กล้อง CCTV", "เน็ตบ้าน + CCTV 2 ตัว", 500, 500, 697, 24, ["เราเตอร์ WiFi 6", "กล้อง CCTV 2 ตัว"]),
]);

function readLabels(value: unknown): string[] {
  const out: string[] = [];
  const push = (label: unknown) => {
    if (typeof label === "string" && label.trim()) out.push(label.trim());
  };

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item === "string") return push(item);
      if (item && typeof item === "object") {
        const data = item as Record<string, unknown>;
        push(data.text ?? data.label ?? data.title ?? data.name);
      }
    });
  } else if (typeof value === "string") {
    value.split(",").forEach(push);
  }

  return out;
}

/** "500Mbps/500Mbps" -> { down: 500, label: "500/500 Mbps" } */
function readSpeed(raw: unknown): { down: number | null; label: string | null } {
  if (typeof raw !== "string" || !raw.trim()) return { down: null, label: null };
  const numbers = raw.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (numbers.length === 0) return { down: null, label: raw.trim() };
  const unit = /gbps/i.test(raw) ? "Gbps" : "Mbps";
  const down = unit === "Gbps" ? numbers[0] * 1000 : numbers[0];
  return { down, label: `${numbers.slice(0, 2).join("/")} ${unit}` };
}

/**
 * Broadband promotions for the homepage. Falls back to the static list when the
 * database is unreachable or has no active broadband promotion, so the page
 * never renders without package content.
 */
export async function getHomePackages(): Promise<HomePackage[]> {
  try {
    const { prisma } = await import("@/src/lib/prisma");
    const rows: any[] = await (prisma as any).promotion.findMany({
      where: { status: true, type: "broadband" },
      orderBy: { displayOrder: "asc" },
      take: 24,
    });

    const drafts: Draft[] = rows
      .filter((row) => typeof row?.name === "string" && Number.isFinite(Number(row?.price)))
      .map((row) => {
        const perks = readLabels(row.perks);
        const speed = readSpeed(row.speed);
        const category =
          typeof row.categoryName === "string" && row.categoryName.trim()
            ? row.categoryName.split(",")[0].trim()
            : "เน็ตบ้าน";

        return {
          id: String(row.id),
          name: row.name.trim(),
          category,
          down: speed.down,
          speedLabel: speed.label,
          price: Number(row.price),
          termLabel: typeof row.validity === "string" && row.validity.trim() ? row.validity.trim() : null,
          perks: perks.length > 0 ? perks : readLabels(row.details),
          buyUrl: row.buyUrl,
        };
      });

    return drafts.length > 0 ? finalize(drafts) : FALLBACK_PACKAGES;
  } catch (error) {
    console.error("[home] โหลดโปรโมชันเน็ตบ้านไม่สำเร็จ ใช้รายการสำรองแทน:", error);
    return FALLBACK_PACKAGES;
  }
}

export type HeroPlan = {
  /** Id of the package behind this plan. */
  id: string;
  k: HomeArt;
  label: string;
  name: string;
  price: number;
  /** "500/500 Mbps · สัญญา 24 เดือน" */
  meta: string;
};

const HERO_LABELS: Record<HomeArt, string> = {
  net: "ทั่วไป",
  movie: "ดูหนัง ซีรีส์",
  game: "เล่นเกม",
  cctv: "กล้องวงจรปิด",
  mesh: "บ้านหลายชั้น",
};

/**
 * One plan per use case for the hero. The first is always the cheapest package
 * overall, so the hero's "เริ่ม N บาท" matches the page title. The rest are the
 * cheapest package of each kind; kinds with no package are left out.
 */
export function buildHeroPlans(packages: HomePackage[]): HeroPlan[] {
  const byPrice = [...packages].sort((a, b) => a.price - b.price);
  const toPlan = (item: HomePackage, k: HomeArt): HeroPlan => ({
    id: item.id,
    k,
    label: HERO_LABELS[k],
    name: item.name,
    price: item.price,
    meta: [item.speedLabel, item.termLabel].filter(Boolean).join(" · "),
  });

  const first = byPrice[0];
  const plans = [toPlan(first, "net")];
  (["movie", "game", "cctv", "mesh"] as const).forEach((k) => {
    const match = byPrice.find((item) => item.art === k && item.id !== first.id);
    if (match) plans.push(toPlan(match, k));
  });
  return plans;
}

export type LeadPlan = {
  id: string;
  name: string;
  price: number;
  /** Speed, contract term and what comes with the plan, in one line. */
  info: string;
};

/** Every package as a choice in the lead form. */
export function buildLeadPlans(packages: HomePackage[]): LeadPlan[] {
  return packages.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    info: [item.speedLabel, item.termLabel, ...item.perks].filter(Boolean).join(" · "),
  }));
}
