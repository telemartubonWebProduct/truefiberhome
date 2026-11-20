import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/src/components/home/home.css";
import "@/src/components/home/area.css";
import "@/src/components/home/guide.css";
import HomeIcon from "@/src/components/home/HomeIcon";
import PackageGrid from "@/src/components/home/PackageGrid";
import { tfhClass } from "@/src/components/home/fonts";
import { formatPrice } from "@/src/components/home/package-art";
import TrackedLineLink from "@/src/app/home/components/TrackedLineLink";
import { lineSupport } from "@/src/context/line-path";
import { GUIDES } from "@/src/data/guides";
import { INSTALL_STEPS } from "@/src/data/install-steps";
import type { ProvinceArea } from "@/src/data/province-areas";
import { LISTED_AREAS, areaPath, districtUnit, findArea, provinceLabel } from "@/src/lib/areas";
import { getHomePackages } from "@/src/lib/home-packages";
import { absoluteUrl, formatPhone, telHref } from "@/src/lib/site";
import { getSitePhones } from "@/src/lib/site-phones";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return LISTED_AREAS.map((area) => ({ slug: area.slug }));
}

const loadPackages = cache(getHomePackages);

async function lowestPrice(): Promise<string> {
  const packages = await loadPackages();
  return formatPrice(Math.min(...packages.map((item) => item.price)));
}

/** Questions whose answers depend on the province, so each page's FAQ is its own. */
function areaFaq(area: ProvinceArea, from: string) {
  const unit = districtUnit(area);
  const label = provinceLabel(area);
  return [
    {
      q: `เน็ตบ้านทรูติดตั้งได้ทุก${unit}ใน${label}ไหม`,
      a: `ไม่ทุกจุด ขึ้นกับว่ามีสายไฟเบอร์ผ่านหน้าบ้านหรือไม่ ${label}มี ${area.districts.length} ${unit} และแต่ละซอยเข้าถึงไม่เท่ากัน ส่งตำแหน่งบ้านหรือปักหมุดทาง LINE เจ้าหน้าที่จะเช็กคู่สายตามที่อยู่จริงแล้วแจ้งผลให้`,
    },
    {
      q: `สมัครเน็ตบ้านทรูใน${label}ราคาเท่าไร`,
      a: `แพ็กเกจเริ่มต้น ${from} บาทต่อเดือน ยังไม่รวมภาษีมูลค่าเพิ่ม ราคาและของที่ได้ขึ้นกับโปรโมชัน ณ วันสมัคร เจ้าหน้าที่แจ้งยอดทั้งหมดก่อนยืนยัน`,
    },
    {
      q: `อยู่${unit}ที่ไม่ใช่ตัวเมืองของ${label} สมัครได้ไหม`,
      a: `สมัครได้ถ้ามีคู่สายถึงบ้าน ไม่ได้จำกัดเฉพาะตัวเมือง ให้ส่งตำแหน่งบ้านมาเช็กก่อน ถ้ายังไม่มีสายถึง เจ้าหน้าที่จะแจ้งให้ทราบตรง ๆ`,
    },
  ];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const area = findArea(slug);
  if (!area) return {};

  const from = await lowestPrice();
  const unit = districtUnit(area);
  const title = `เน็ตบ้านทรู ${area.name} เริ่ม ${from} บาท เช็กพื้นที่ติดตั้ง | True Fiber Home`;
  const description = `สมัครเน็ตบ้านทรูออนไลน์ใน${provinceLabel(area)} เน็ตไฟเบอร์เริ่ม ${from} บาทต่อเดือน พร้อมเราเตอร์ WiFi 6 ส่งตำแหน่งบ้านทาง LINE เพื่อเช็กคู่สายได้ทั้ง ${area.districts.length} ${unit}`;
  const path = areaPath(area);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AreaPage({ params }: Params) {
  const { slug } = await params;
  const area = findArea(slug);
  if (!area) notFound();

  const [packages, phones, from] = await Promise.all([loadPackages(), getSitePhones(), lowestPrice()]);
  const mainPhone = phones[0];
  const unit = districtUnit(area);
  const label = provinceLabel(area);
  const faq = areaFaq(area, from);
  const nearby = LISTED_AREAS.filter((item) => item.region === area.region && item.slug !== area.slug);
  const source = `area_${area.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "หน้าแรก", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "พื้นที่ให้บริการ", item: absoluteUrl("/areas") },
        { "@type": "ListItem", position: 3, name: area.name, item: absoluteUrl(areaPath(area)) },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `เน็ตบ้านทรู ${area.name}`,
      serviceType: "อินเทอร์เน็ตบ้านไฟเบอร์",
      provider: { "@type": "Organization", name: "บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด", url: absoluteUrl("/") },
      areaServed: { "@type": "AdministrativeArea", name: label },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "THB",
        lowPrice: Math.min(...packages.map((item) => item.price)),
        offerCount: packages.length,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
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
        <div className="wrap ar-head-grid">
          <div>
            <nav className="ar-crumbs" aria-label="เส้นทาง">
              <Link href="/">หน้าแรก</Link>
              <Link href="/areas">พื้นที่ให้บริการ</Link>
              <span aria-current="page">{area.name}</span>
            </nav>
            <h1>
              <span className="nb">เน็ตบ้านทรู</span> <em className="nb">{area.name}</em>
            </h1>
            <p className="ar-lead">
              สมัครเน็ตบ้านทรูออนไลน์ใน{label} เริ่ม {from} บาทต่อเดือน ส่งตำแหน่งบ้านทาง LINE
              เจ้าหน้าที่เช็กคู่สายให้ก่อนสมัคร
            </p>
            <div className="ar-acts">
              <TrackedLineLink href={lineSupport} source={source} className="btn btn-k">
                <HomeIcon name="pin" />
                เช็กพื้นที่ทาง LINE
              </TrackedLineLink>
              <a className="btn btn-l" href={telHref(mainPhone)}>
                <HomeIcon name="phone" />
                {formatPhone(mainPhone)}
              </a>
            </div>
            <p className="ar-trust">
              ดำเนินการโดย บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด ตัวแทนจำหน่ายทรูออนไลน์ที่ได้รับการแต่งตั้ง
            </p>
          </div>
          <div className="ar-fig" aria-hidden="true">
            <b>{from}</b>
            <span>บาท/เดือน</span>
            <Image src="/assets/home/k-tech.webp" alt="" width={475} height={1088} sizes="220px" priority />
          </div>
        </div>
      </section>

      <section id="districts">
        <div className="wrap">
          <h2>
            <span className="nb">{unit}ใน{area.name}</span> <span className="nb">ที่ส่งตำแหน่งมาเช็กได้</span>
          </h2>
          <p className="sub">
            {label}มี {area.districts.length} {unit} สายไฟเบอร์เข้าถึงไม่เท่ากันในแต่ละซอย แม้อยู่{unit}เดียวกัน
            จึงต้องเช็กจากตำแหน่งบ้านจริงทุกครั้ง รายชื่อด้านล่างคือ{unit}ทั้งหมดของจังหวัด
            ไม่ได้หมายความว่าติดตั้งได้ทุกจุด
          </p>
          <ul className="prov ar-districts">
            {area.districts.map((district) => (
              <li key={district}>
                {unit}
                {district}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="packages" className="ar-tint">
        <div className="wrap">
          <PackageGrid packages={packages} />
          <p className="fine">
            ราคายังไม่รวมภาษีมูลค่าเพิ่ม ค่าแรกเข้าและเงื่อนไขขึ้นกับโปรโมชัน ณ วันสมัคร
            เจ้าหน้าที่แจ้งยอดทั้งหมดก่อนยืนยัน{" "}
            <Link href="/boardband" style={{ textDecoration: "underline" }}>
              ดูรายละเอียดโปรเน็ตบ้านทั้งหมด
            </Link>
          </p>
        </div>
      </section>

      <section className="redblk">
        <div className="wrap">
          <h2>
            <span className="nb">ติดเน็ตบ้านทรูใน{area.name}</span> <span className="nb">4 ขั้นตอน</span>
          </h2>
          <ol className="steps ar-steps">
            {INSTALL_STEPS.map((step) => (
              <li key={step.title}>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <div className="wrap">
          <h2>คำถามเรื่องเน็ตบ้านทรู {area.name}</h2>
          <div className="faq">
            {faq.map((item, index) => (
              <details key={item.q} open={index === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>

          {nearby.length > 0 && (
            <>
              <h2 style={{ marginTop: 96 }}>จังหวัดอื่นใน{area.region}</h2>
              <ul className="prov">
                {nearby.map((item) => (
                  <li key={item.slug}>
                    <Link href={areaPath(item)}>เน็ตบ้านทรู {item.name}</Link>
                  </li>
                ))}
              </ul>
              <p className="fine">
                <Link href="/areas" style={{ textDecoration: "underline" }}>
                  ดูพื้นที่ให้บริการทุกจังหวัด
                </Link>
              </p>
            </>
          )}

          <h2 style={{ marginTop: 96 }}>คู่มือก่อนติดเน็ตบ้าน</h2>
          <ul className="gd-more">
            {GUIDES.map((guide) => (
              <li key={guide.slug}>
                <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
