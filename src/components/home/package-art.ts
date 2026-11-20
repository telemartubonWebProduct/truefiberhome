import type { HomeArt } from "@/src/lib/home-packages";

export const PACKAGE_ART: Record<HomeArt, { src: string; width: number; height: number; color: string }> = {
  net: { src: "/assets/home/k-router.webp", width: 679, height: 713, color: "var(--c-net)" },
  movie: { src: "/assets/home/k-movie.webp", width: 437, height: 447, color: "var(--c-movie)" },
  cctv: { src: "/assets/home/k-cctv.webp", width: 356, height: 458, color: "var(--c-cctv)" },
  mesh: { src: "/assets/home/k-mesh.webp", width: 342, height: 362, color: "var(--c-mesh)" },
  game: { src: "/assets/home/k-game.webp", width: 481, height: 421, color: "var(--c-game)" },
};

/** Keeps "เน็ตบ้านทรู" on one line: Thai line breaking splits it mid-word otherwise. */
export function splitBrandPhrase(text: string): [string, string, string] | null {
  const phrase = "เน็ตบ้านทรู";
  const index = text.indexOf(phrase);
  if (index < 0) return null;
  return [text.slice(0, index), phrase, text.slice(index + phrase.length)];
}

export function formatPrice(price: number): string {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}
