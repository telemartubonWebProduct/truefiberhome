# SEO foundation + new homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the canonical/redirect/sitemap faults found in the audit and replace the homepage with the approved round 4 design, fully server-rendered.

**Architecture:** One canonical origin helper (`src/lib/site.ts`) feeds metadata, robots, sitemap and JSON-LD. The homepage moves to `src/app/page.tsx` as a server component that reads broadband promotions from Prisma with a static fallback, and composes small components under `src/components/home/`. Interactivity (filter, chooser, region tabs, motion) lives in client components that still render all content into the initial HTML.

**Tech Stack:** Next.js 16.4.2 App Router, React 19, Prisma 7, Tailwind 4 (existing pages), plain scoped CSS for the homepage, `next/font/google`, `next/image`.

**Spec:** `docs/design/homepage-draft.src.html` (approved round 4 draft) and the audit findings in the session of 2026-11-19.

## Global Constraints

- Canonical origin is `https://www.truefiberhome.com` (the host that answers 200). Never emit the non-www host.
- The homepage URL is `/`. `/home` must answer 308 to `/`.
- Every package name, price, speed, contract term and perk must be in the server HTML.
- No invented claims: no reviews, customer counts or awards. Copy comes from the draft.
- LINE link: `lineSupport` from `src/context/line-path.ts`. Phones come from `SiteSettings.phone`, split into separate numbers.
- Colours: red `#e5132d`, ink `#141414`, cream `#fff6e6`, sun `#ffd23f`, sky `#a9e4ff`. Fonts: Anuphan (text), Bagel Fat One (numerals).
- Respect `prefers-reduced-motion`. No horizontal scroll at 375px.
- The repo has no test runner. Each task is verified with `npx tsc --noEmit`, `npx eslint <files>` and a rendered-HTML check.
- Do not rename `/boardband`, `/wEnergy` or build province pages here. Those are later plans.

## Review Focus

- Database unreachable or empty promotions table: the homepage must still render the static package list, not a 500.
- `SiteSettings.phone` stored as `"0639274977 และ 0639234798"`: must yield two valid `tel:` links and two schema phone values.
- A promotion with no speed, no validity or no perks: the card renders without empty rows or "undefined".
- `NEXT_PUBLIC_SITE_URL` set to the non-www host in Vercel: canonical and sitemap must still use www.
- JavaScript disabled or slow: all packages, FAQ answers and provinces are visible in HTML; nothing stays hidden waiting for an observer.

---

### Task 1: Canonical origin and phone helpers

**Files:** Create `src/lib/site.ts`. Modify `src/app/layout.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/components/layout/Footer.tsx`.

**Interfaces:** Produces `SITE_URL: string`, `absoluteUrl(path: string): string`, `parsePhones(raw?: string | null): string[]`, `telHref(phone: string): string`.

- [ ] `SITE_URL` reads `NEXT_PUBLIC_SITE_URL`; when its hostname is `truefiberhome.com` it is rewritten to `www.truefiberhome.com`; trailing slash stripped; default `https://www.truefiberhome.com`.
- [ ] `parsePhones` splits on `,`, `/`, `และ`, keeps digits and leading `+`, drops entries with fewer than 9 digits.
- [ ] Layout: `metadataBase` from `SITE_URL`, remove the layout-level `canonical: "/home"`, `openGraph.url` = `SITE_URL`, Organization JSON-LD `contactPoint` one entry per phone, add `WebSite` JSON-LD.
- [ ] robots: drop `/home` from allow, sitemap URL from `SITE_URL`.
- [ ] sitemap: first route `/`, remove `/home` and `/stories`.
- [ ] Footer uses `parsePhones` and `telHref`.
- [ ] Verify: `npx tsc --noEmit` passes.

### Task 2: `/home` becomes a permanent redirect

**Files:** Modify `next.config.ts`, every file calling `revalidatePath("/home")`. Delete `src/app/home/page.tsx` (replaced in Task 4).

- [ ] `redirects()` returns `{ source: "/home", destination: "/", permanent: true }`.
- [ ] Replace `revalidatePath("/home")` with `revalidatePath("/")` across `src/app/api`.
- [ ] Verify: `grep -rn 'revalidatePath("/home")' src` prints nothing.

### Task 3: Homepage data

**Files:** Create `src/lib/home-packages.ts`, `src/data/provinces.ts`, `src/data/home-faq.ts`.

**Interfaces:** Produces
`type HomeArt = "net" | "movie" | "cctv" | "mesh" | "game"`;
`type HomePackage = { id: string; name: string; category: string; art: HomeArt; down: number | null; speedLabel: string | null; price: number; termLabel: string | null; perks: string[]; buyUrl: string; hot: boolean }`;
`getHomePackages(): Promise<HomePackage[]>`; `FALLBACK_PACKAGES: HomePackage[]`;
`REGIONS: { name: string; provinces: string[] }[]` (77 provinces); `ALL_PROVINCES: string[]` sorted with `localeCompare(…, "th")`;
`HOME_FAQ: { q: string; a: string }[]` (the five from the draft).

- [ ] `getHomePackages` imports Prisma dynamically inside `try`, reads `promotion` where `status: true, type: "broadband"` ordered by `displayOrder`; on throw or empty result returns `FALLBACK_PACKAGES` (the nine from the draft).
- [ ] Art rule on name + perks + category, first match: `cctv|กล้อง` → cctv; `mesh` → mesh; `netflix|youtube|now|iqiyi|ดูหนัง|series` → movie; download ≥ 1000 → game; else net.
- [ ] `down` parsed from the first number in `speed`; `hot` = lowest price item only.
- [ ] `buyUrl` falls back to `lineSupport` when empty, `#` or `/service`.

### Task 4: Homepage components and page

**Files:** Create `src/components/home/home.css`, `HeroMotion.tsx`, `AreaCheckForm.tsx`, `PackageGrid.tsx`, `SpeedChooser.tsx`, `AreaSection.tsx`, `Reveal.tsx`; rewrite `src/app/page.tsx`.

**Interfaces:** Consumes Task 1 and Task 3 exports. `PackageGrid({ packages })`, `SpeedChooser({ packages })`, `AreaSection({ regions })`, `AreaCheckForm({ provinces, href })`.

- [ ] `home.css` ports the draft CSS scoped under `.tfh`; `.rv` is only hidden when `html.js-rv` is set, so content is visible without JavaScript.
- [ ] `page.tsx`: `revalidate = 300`; metadata title `สมัครเน็ตบ้านทรู ไฟเบอร์ เริ่ม {min} บาท เช็กพื้นที่ทั่วไทย` (absolute, with brand), canonical `/`; fonts through `next/font/google`; sections in draft order; top padding clears the fixed navbar.
- [ ] Giant numeral and H1 price use the minimum package price.
- [ ] `PackageGrid` renders every package in HTML; filter toggles `hidden`.
- [ ] `AreaSection` renders all six regions in HTML; inactive regions use `hidden`. Province names are text, not links, until province pages exist.
- [ ] JSON-LD: `ItemList` of `Offer` (price, `THB`) and `FAQPage` from `HOME_FAQ`.
- [ ] LINE links go through `TrackedLineLink`.
- [ ] Verify: `npx tsc --noEmit`, `npx eslint src/app/page.tsx src/components/home src/lib/site.ts src/lib/home-packages.ts`.

### Task 5: Rendered check

- [ ] Start `next dev` with placeholder aligned environment variables (no database). `curl /` returns 200 and the HTML contains all nine package names, `499`, five FAQ questions and `กรุงเทพมหานคร`.
- [ ] `curl -I /home` returns 308 to `/`.
- [ ] Canonical in HTML is `https://www.truefiberhome.com`; `/sitemap.xml` has no `/home`.
- [ ] Browser check at 375px and 1280px: no horizontal scroll, no console errors.
