import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/src/lib/prisma";
import CategoryFilter from "./components/CategoryFilter";
import ArticleCardAnimated from "./components/ArticleCardAnimated";

export const metadata: Metadata = {
  title: "บทความและข่าวสาร",
  description:
    "รวมบทความ ข่าวสาร โปรโมชั่น และเคล็ดลับด้านอินเทอร์เน็ต โทรศัพท์มือถือ และพลังงานสะอาดจาก True Fiber Home",
  alternates: { canonical: "/articles" },
  openGraph: {
    title: "บทความและข่าวสาร | True Fiber Home",
    description:
      "อ่านบทความล่าสุดจาก True Fiber Home — เน็ตบ้าน มือถือ และโซลาร์เซลล์",
    url: "/articles",
    type: "website",
  },
};

export const revalidate = 60;

function formatThaiDate(value: Date | string | null): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function toTagList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((t): t is string => typeof t === "string");
  }
  return [];
}

export default async function ArticlesPage(props: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const selectedCategory = searchParams.category?.trim() || "";
  const query = searchParams.q?.trim() || "";

  const articleDelegate = (prisma as any).article;

  if (!articleDelegate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-20">
        <p className="text-gray-500">ยังไม่มีระบบบทความ กรุณารัน migration</p>
      </div>
    );
  }

  const where: any = { isPublished: true };
  if (selectedCategory) {
    where.category = { equals: selectedCategory, mode: "insensitive" };
  }
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { excerpt: { contains: query, mode: "insensitive" } },
    ];
  }

  const [allArticles, categoriesRaw] = await Promise.all([
    articleDelegate.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    articleDelegate.findMany({
      where: { isPublished: true, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const categories = Array.from(
    new Set(
      (categoriesRaw as Array<{ category: string | null }>)
        .map((c) => (c.category || "").trim())
        .filter(Boolean)
    )
  );

  const articles = allArticles as any[];
  const featured =
    !selectedCategory && !query
      ? articles.find((a) => a.isFeatured) || articles[0] || null
      : null;
  const restArticles = featured
    ? articles.filter((a) => a.id !== featured.id)
    : articles;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff7f5] via-white to-white">
      {/* Hero header */}
      <section className="relative overflow-hidden border-b border-rose-100/60">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-orange-200/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 sm:pt-28 sm:pb-20 lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500 mb-4">
            Stories · Insights · Updates
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-gray-900 leading-tight max-w-3xl">
            บทความและข่าวสาร
          </h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
            แรงบันดาลใจ เคล็ดลับ และข่าวสารล่าสุดจาก True Fiber Home
            อ่านเพื่อต่อยอดประสบการณ์ดิจิทัลของคุณให้สมบูรณ์ยิ่งขึ้น
          </p>

          <form
            action="/articles"
            method="get"
            className="mt-8 flex w-full max-w-xl items-center gap-2 rounded-full border border-gray-200 bg-white/80 backdrop-blur px-2 py-2 shadow-sm"
          >
            {selectedCategory && (
              <input type="hidden" name="category" value={selectedCategory} />
            )}
            <div className="flex items-center pl-3 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                />
              </svg>
            </div>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="ค้นหาบทความ..."
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-gray-700 placeholder:text-gray-400 outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              ค้นหา
            </button>
          </form>
        </div>
      </section>

      {/* Featured article */}
      {featured && (
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <Link
            href={`/articles/${featured.slug}`}
            className="group block overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-40px_rgba(225,29,72,0.25)] ring-1 ring-rose-100/60 transition hover:-translate-y-1 hover:shadow-[0_30px_80px_-30px_rgba(225,29,72,0.35)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-5">
              <div className="relative lg:col-span-3 h-72 sm:h-96 lg:h-[28rem] overflow-hidden bg-gradient-to-br from-rose-100 via-orange-50 to-amber-50">
                {featured.coverImage ? (
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-rose-300 font-serif text-4xl">
                    True Fiber Home
                  </div>
                )}
                <div className="absolute top-5 left-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-3.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Featured
                </div>
              </div>

              <div className="lg:col-span-2 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                {featured.category && (
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500 mb-4">
                    {featured.category}
                  </p>
                )}
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight text-gray-900 group-hover:text-rose-600 transition-colors">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-4 text-gray-600 leading-relaxed line-clamp-4">
                    {featured.excerpt}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {featured.author && (
                    <span className="font-medium text-gray-700">
                      {featured.author}
                    </span>
                  )}
                  {featured.author && <span className="text-gray-300">·</span>}
                  <span>{formatThaiDate(featured.publishedAt || featured.createdAt)}</span>
                  {featured.readingTime ? (
                    <>
                      <span className="text-gray-300">·</span>
                      <span>อ่าน {featured.readingTime} นาที</span>
                    </>
                  ) : null}
                </div>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-rose-600 group-hover:gap-3 transition-all">
                  อ่านบทความ
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14m0 0-6-6m6 6-6 6"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10">
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          query={query}
        />
      </section>

      {/* Articles grid */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        {restArticles.length === 0 && !featured ? (
          <div className="rounded-3xl border border-dashed border-rose-200 bg-white p-16 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-rose-50 flex items-center justify-center mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-rose-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3m3-1.5v1.5M6.75 21h10.5a2.25 2.25 0 0 0 2.25-2.25V9.456a2.25 2.25 0 0 0-.659-1.59l-4.706-4.707A2.25 2.25 0 0 0 12.546 2.5H6.75A2.25 2.25 0 0 0 4.5 4.75v14a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              ยังไม่มีบทความในหมวดนี้
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              ลองเลือกหมวดอื่น หรือกลับมาอีกครั้งเร็ว ๆ นี้
            </p>
            <Link
              href="/articles"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              ดูบทความทั้งหมด
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {restArticles.map((article, idx) => (
              <ArticleCardAnimated
                key={article.id}
                index={idx}
                article={{
                  id: article.id,
                  title: article.title,
                  slug: article.slug,
                  excerpt: article.excerpt,
                  coverImage: article.coverImage,
                  category: article.category,
                  author: article.author,
                  readingTime: article.readingTime,
                  publishedAt: article.publishedAt
                    ? new Date(article.publishedAt).toISOString()
                    : null,
                  createdAt: new Date(article.createdAt).toISOString(),
                  tags: toTagList(article.tags),
                  formattedDate: formatThaiDate(article.publishedAt || article.createdAt),
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
