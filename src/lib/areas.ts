import { PROVINCE_AREAS, type ProvinceArea } from "@/src/data/province-areas";

/**
 * Provinces served by the sister site truegetherth.com, which already ranks for
 * them. They get no area page here so the two sites do not compete.
 */
const COVERED_ELSEWHERE = new Set(["อุบลราชธานี", "ศรีสะเกษ", "อำนาจเจริญ"]);

/** Provinces that have an area page on this site. */
export const LISTED_AREAS: ProvinceArea[] = PROVINCE_AREAS.filter((area) => !COVERED_ELSEWHERE.has(area.name));

export function findArea(slug: string): ProvinceArea | undefined {
  return LISTED_AREAS.find((area) => area.slug === slug);
}

export function areaPath(area: ProvinceArea): string {
  return `/areas/${area.slug}`;
}

/** Province name -> area page path, for components that only know the name. */
export function areaLinks(): Record<string, string> {
  return Object.fromEntries(LISTED_AREAS.map((area) => [area.name, areaPath(area)]));
}

const BANGKOK = "กรุงเทพมหานคร";

/** Bangkok is divided into เขต; every other province into อำเภอ. */
export function districtUnit(area: ProvinceArea): string {
  return area.name === BANGKOK ? "เขต" : "อำเภอ";
}

/** "จังหวัดเชียงใหม่", but plain "กรุงเทพมหานคร". */
export function provinceLabel(area: ProvinceArea): string {
  return area.name === BANGKOK ? area.name : `จังหวัด${area.name}`;
}
