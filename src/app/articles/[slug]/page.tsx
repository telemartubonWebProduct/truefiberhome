import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 60;

function formatThaiDate(value: Date | string | null): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function toTagList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((t): t is string => typeof t === "string");
  }
  return [];
}

async function getArticleBySlug(slug: string) {
  const articleDelegate = (prisma as any).article;
  if (!articleDelegate) return null;

  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    decoded = slug;
  }
  const nfc = decoded.normalize("NFC");
  const nfd = decoded.normalize("NFD");

  const candidates = Array.from(new Set([slug, decoded, nfc, nfd]));

  for (const candidate of candidates) {
    const found = await articleDelegate.findUnique({ where: { slug: candidate } });
    if (found) return found;
  }

  return null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "ไม่พบบทความ" };
  }

  const title = article.seoTitle || article.title;
  const description =
    article.seoDescription || article.excerpt || "บทความจาก True Fiber Home";

  return {
    title,
    description,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      title,
      description,
      url: `/articles/${article.slug}`,
      type: "article",
      publishedTime: article.publishedAt
        ? new Date(article.publishedAt).toISOString()
        : undefined,
      images: article.coverImage
        ? [{ url: article.coverImage, alt: article.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: Params) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || !article.isPublished) {
    notFound();
  }

  const articleDelegate = (prisma as any).article;
  const related = articleDelegate
    ? await articleDelegate.findMany({
        where: {
          isPublished: true,
          id: { not: article.id },
          ...(article.category ? { category: article.category } : {}),
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 3,
      })
    : [];

  const tags = toTagList(article.tags);
  const publishedDisplay = formatThaiDate(article.publishedAt || article.createdAt);
  const layout = article.layout || "default";

  const meta = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
      {article.author && (
        <span className="inline-flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-orange-400 text-xs font-bold text-white">
            {article.author.slice(0, 1).toUpperCase()}
          </span>
          <span className="font-semibold text-gray-700">{article.author}</span>
        </span>
      )}
      {publishedDisplay && <span>{publishedDisplay}</span>}
      {article.readingTime ? <span>· อ่าน {article.readingTime} นาที</span> : null}
    </div>
  );

  const tagChips =
    tags.length > 0 ? (
      <div className="flex flex-wrap gap-2 pt-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600"
          >
            #{tag}
          </span>
        ))}
      </div>
    ) : null;

  const breadcrumbs = (
    <nav
      aria-label="breadcrumb"
      className="mx-auto max-w-7xl px-6 lg:px-10 pt-8 text-xs text-gray-400"
    >
      <ol className="flex items-center gap-2">
        <li>
          <Link href="/home" className="hover:text-rose-600 transition">
            หน้าแรก
          </Link>
        </li>
        <li>/</li>
        <li>
          <Link href="/articles" className="hover:text-rose-600 transition">
            บทความ
          </Link>
        </li>
        <li>/</li>
        <li className="truncate text-gray-600 max-w-[40ch]" title={article.title}>
          {article.title}
        </li>
      </ol>
    </nav>
  );

  const contentBlock = (
    <div
      className="article-prose"
      dangerouslySetInnerHTML={{ __html: article.content }}
    />
  );

  const ldJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || article.seoDescription || "",
    image: article.coverImage ? [article.coverImage] : undefined,
    author: article.author
      ? { "@type": "Organization", name: article.author }
      : { "@type": "Organization", name: "True Fiber Home" },
    publisher: {
      "@type": "Organization",
      name: "True Fiber Home",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.truefiberhome.com"}/assets/Trueonline-logo.svg.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.truefiberhome.com"}/articles/${article.slug}`,
    },
    datePublished: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : undefined,
    dateModified: article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : undefined,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson }}
      />

      <div className="min-h-screen bg-gradient-to-b from-[#fff7f5] via-white to-white">
        {breadcrumbs}

        {layout === "full-width" && (
          <FullWidthLayout
            article={article}
            meta={meta}
            tagChips={tagChips}
            contentBlock={contentBlock}
            publishedDisplay={publishedDisplay}
          />
        )}

        {layout === "magazine" && (
          <MagazineLayout
            article={article}
            meta={meta}
            tagChips={tagChips}
            contentBlock={contentBlock}
            related={related}
          />
        )}

        {layout === "minimal" && (
          <MinimalLayout
            article={article}
            meta={meta}
            tagChips={tagChips}
            contentBlock={contentBlock}
          />
        )}

        {(layout === "default" || !["full-width", "magazine", "minimal"].includes(layout)) && (
          <DefaultLayout
            article={article}
            meta={meta}
            tagChips={tagChips}
            contentBlock={contentBlock}
          />
        )}

        {related.length > 0 && layout !== "magazine" && (
          <RelatedSection articles={related} />
        )}
      </div>
    </>
  );
}

/* ─────────────  Layout Components  ───────────── */

function DefaultLayout({
  article,
  meta,
  tagChips,
  contentBlock,
}: {
  article: any;
  meta: React.ReactNode;
  tagChips: React.ReactNode;
  contentBlock: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 lg:px-0 py-12 sm:py-16">
      <header className="mb-12 text-center">
        {article.category && (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500 mb-5">
            {article.category}
          </p>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-gray-900 mb-6">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            {article.excerpt}
          </p>
        )}
        <div className="flex justify-center">{meta}</div>
      </header>

      {article.coverImage && (
        <div className="relative aspect-[16/9] mb-12 overflow-hidden rounded-3xl shadow-[0_30px_80px_-40px_rgba(0,0,0,0.3)]">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      {contentBlock}

      <footer className="mt-16 border-t border-gray-100 pt-8">{tagChips}</footer>
    </article>
  );
}

function FullWidthLayout({
  article,
  meta,
  tagChips,
  contentBlock,
  publishedDisplay,
}: {
  article: any;
  meta: React.ReactNode;
  tagChips: React.ReactNode;
  contentBlock: React.ReactNode;
  publishedDisplay: string;
}) {
  return (
    <article>
      <section className="relative h-[68vh] min-h-[440px] w-full overflow-hidden">
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-rose-200 via-orange-200 to-amber-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-6 pb-14 lg:px-10 lg:pb-20 text-white">
          {article.category && (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300 mb-5">
              {article.category}
            </p>
          )}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold leading-tight max-w-4xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-5 max-w-2xl text-base sm:text-lg text-white/85 leading-relaxed">
              {article.excerpt}
            </p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80">
            {article.author && (
              <span className="font-semibold text-white">{article.author}</span>
            )}
            {publishedDisplay && <span>{publishedDisplay}</span>}
            {article.readingTime ? <span>· อ่าน {article.readingTime} นาที</span> : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 lg:px-0 py-16 sm:py-20">
        {contentBlock}
        <footer className="mt-16 border-t border-gray-100 pt-8">{tagChips}</footer>
      </div>
    </article>
  );
}

function MagazineLayout({
  article,
  meta,
  tagChips,
  contentBlock,
  related,
}: {
  article: any;
  meta: React.ReactNode;
  tagChips: React.ReactNode;
  contentBlock: React.ReactNode;
  related: any[];
}) {
  return (
    <article className="mx-auto max-w-7xl px-6 lg:px-10 py-12 sm:py-16">
      <header className="mb-10 max-w-4xl">
        {article.category && (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500 mb-4">
            {article.category}
          </p>
        )}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-gray-900 mb-5">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="text-lg text-gray-600 leading-relaxed mb-6 max-w-3xl">
            {article.excerpt}
          </p>
        )}
        {meta}
      </header>

      {article.coverImage && (
        <div className="relative aspect-[21/9] mb-12 overflow-hidden rounded-3xl shadow-[0_30px_80px_-40px_rgba(0,0,0,0.3)]">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-8">
          {contentBlock}
          <footer className="mt-16 border-t border-gray-100 pt-8">{tagChips}</footer>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-8">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-rose-100/60 shadow-sm">
              <h3 className="font-serif text-xl font-semibold text-gray-900 mb-4">
                เกี่ยวกับบทความนี้
              </h3>
              <dl className="space-y-3 text-sm">
                {article.author && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-gray-400">
                      ผู้เขียน
                    </dt>
                    <dd className="text-gray-700 font-medium">{article.author}</dd>
                  </div>
                )}
                {article.category && (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-gray-400">
                      หมวดหมู่
                    </dt>
                    <dd>
                      <Link
                        href={`/articles?category=${encodeURIComponent(article.category)}`}
                        className="text-rose-600 hover:underline"
                      >
                        {article.category}
                      </Link>
                    </dd>
                  </div>
                )}
                {article.readingTime ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-gray-400">
                      เวลาอ่าน
                    </dt>
                    <dd className="text-gray-700">{article.readingTime} นาที</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {related.length > 0 && (
              <div>
                <h3 className="font-serif text-xl font-semibold text-gray-900 mb-4">
                  บทความที่เกี่ยวข้อง
                </h3>
                <ul className="space-y-5">
                  {related.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/articles/${r.slug}`}
                        className="group flex gap-3 items-start"
                      >
                        {r.coverImage && (
                          <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            <Image
                              src={r.coverImage}
                              alt={r.title}
                              fill
                              sizes="80px"
                              className="object-cover transition-transform group-hover:scale-110"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-gray-800 group-hover:text-rose-600 transition line-clamp-2">
                            {r.title}
                          </h4>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatThaiDate(r.publishedAt || r.createdAt)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function MinimalLayout({
  article,
  meta,
  tagChips,
  contentBlock,
}: {
  article: any;
  meta: React.ReactNode;
  tagChips: React.ReactNode;
  contentBlock: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-2xl px-6 lg:px-0 py-16 sm:py-24">
      <header className="mb-10">
        {article.category && (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500 mb-4">
            {article.category}
          </p>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight text-gray-900 mb-5">
          {article.title}
        </h1>
        {meta}
      </header>
      {contentBlock}
      <footer className="mt-12 border-t border-gray-100 pt-6">{tagChips}</footer>
    </article>
  );
}

function RelatedSection({ articles }: { articles: any[] }) {
  return (
    <section className="bg-gradient-to-b from-white to-rose-50/40 border-t border-rose-100/60">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500 mb-3">
              Continue Reading
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-gray-900">
              บทความที่คุณอาจสนใจ
            </h2>
          </div>
          <Link
            href="/articles"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:gap-3 transition-all"
          >
            ดูทั้งหมด
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
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/articles/${a.slug}`}
              className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg hover:ring-rose-200"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-rose-50 to-orange-50">
                {a.coverImage ? (
                  <Image
                    src={a.coverImage}
                    alt={a.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-serif text-2xl text-rose-300">
                    {a.title.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="p-5">
                {a.category && (
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-500 mb-2">
                    {a.category}
                  </p>
                )}
                <h3 className="font-serif text-lg font-semibold leading-snug text-gray-900 group-hover:text-rose-600 transition line-clamp-2">
                  {a.title}
                </h3>
                <p className="mt-3 text-xs text-gray-400">
                  {formatThaiDate(a.publishedAt || a.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
