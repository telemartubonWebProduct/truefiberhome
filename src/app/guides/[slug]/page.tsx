import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/src/components/home/home.css";
import "@/src/components/home/area.css";
import "@/src/components/home/guide.css";
import HomeIcon from "@/src/components/home/HomeIcon";
import { tfhClass } from "@/src/components/home/fonts";
import TrackedLineLink from "@/src/app/home/components/TrackedLineLink";
import { lineSupport } from "@/src/context/line-path";
import { GUIDES, findGuide } from "@/src/data/guides";
import { absoluteUrl } from "@/src/lib/site";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return {};

  const title = `${guide.title} | True Fiber Home`;
  const path = `/guides/${guide.slug}`;
  return {
    title: { absolute: title },
    description: guide.description,
    alternates: { canonical: path },
    openGraph: { title, description: guide.description, url: path, type: "article", publishedTime: guide.published },
    twitter: { card: "summary_large_image", title, description: guide.description },
  };
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("th-TH", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));

export default async function GuidePage({ params }: Params) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();

  const path = `/guides/${guide.slug}`;
  const others = GUIDES.filter((item) => item.slug !== guide.slug);
  const publisher = { "@type": "Organization", name: "บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด", url: absoluteUrl("/") };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "หน้าแรก", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "คู่มือ", item: absoluteUrl("/guides") },
        { "@type": "ListItem", position: 3, name: guide.short, item: absoluteUrl(path) },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      datePublished: guide.published,
      dateModified: guide.published,
      inLanguage: "th",
      mainEntityOfPage: absoluteUrl(path),
      author: publisher,
      publisher,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <div className={tfhClass}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="ar-head">
        <div className="wrap gd-wrap">
          <nav className="ar-crumbs" aria-label="เส้นทาง">
            <Link href="/">หน้าแรก</Link>
            <Link href="/guides">คู่มือ</Link>
            <span aria-current="page">{guide.short}</span>
          </nav>
          <h1 className="gd-title">{guide.title}</h1>
          <p className="gd-meta">
            โดยทีมงาน True Fiber Home · เผยแพร่ <time dateTime={guide.published}>{formatDate(guide.published)}</time>
          </p>
        </div>
      </section>

      <article className="gd-body">
        <div className="wrap gd-wrap">
          <p className="gd-summary">{guide.summary}</p>

          {guide.sections.map((section) => (
            <section key={section.heading} className="gd-section">
              <h2>{section.heading}</h2>
              {section.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
              {section.points && (
                <ul>
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
              {section.table && (
                <div className="gd-table">
                  <table>
                    <thead>
                      <tr>
                        {section.table[0].map((cell, index) => (
                          <th key={index} scope="col">
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.slice(1).map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell, index) =>
                            index === 0 ? (
                              <th key={index} scope="row">
                                {cell}
                              </th>
                            ) : (
                              <td key={index}>{cell}</td>
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}

          <section className="gd-section">
            <h2>คำถามที่พบบ่อย</h2>
            <div className="faq">
              {guide.faq.map((item, index) => (
                <details key={item.q} open={index === 0}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <aside className="gd-cta">
            <div>
              <h2>อยากรู้ว่าบ้านคุณติดเน็ตบ้านทรูได้ไหม</h2>
              <p>ส่งตำแหน่งบ้านทาง LINE เจ้าหน้าที่เช็กคู่สายตามที่อยู่จริงแล้วแจ้งผลให้</p>
            </div>
            <div className="gd-cta-acts">
              <TrackedLineLink href={lineSupport} source={`guide_${guide.slug}`} className="btn btn-r">
                <HomeIcon name="pin" />
                เช็กพื้นที่ทาง LINE
              </TrackedLineLink>
              <Link className="btn btn-l" href="/#packages">
                ดูแพ็กเกจและราคา
              </Link>
            </div>
          </aside>

          <section className="gd-section">
            <h2>อ่านต่อ</h2>
            <ul className="gd-more">
              {others.map((item) => (
                <li key={item.slug}>
                  <Link href={`/guides/${item.slug}`}>{item.title}</Link>
                </li>
              ))}
              <li>
                <Link href="/areas">พื้นที่ให้บริการเน็ตบ้านทรูรายจังหวัด</Link>
              </li>
            </ul>
          </section>
        </div>
      </article>
    </div>
  );
}
