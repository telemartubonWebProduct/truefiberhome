import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@/src/components/home/home.css";
import "@/src/components/home/guide.css";
import AreaSection from "@/src/components/home/AreaSection";
import { tfhClass } from "@/src/components/home/fonts";
import HeroMotion from "@/src/components/home/HeroMotion";
import HomeIcon from "@/src/components/home/HomeIcon";
import HomeMotion from "@/src/components/home/HomeMotion";
import PackageGrid from "@/src/components/home/PackageGrid";
import SpeedChooser from "@/src/components/home/SpeedChooser";
import { formatPrice } from "@/src/components/home/package-art";
import TrackedLineLink from "@/src/app/home/components/TrackedLineLink";
import { lineSupport } from "@/src/context/line-path";
import { GUIDES } from "@/src/data/guides";
import { HOME_FAQ } from "@/src/data/home-faq";
import { INSTALL_STEPS } from "@/src/data/install-steps";
import { REGIONS } from "@/src/data/provinces";
import { areaLinks } from "@/src/lib/areas";
import { buildHeroPlans, getHomePackages } from "@/src/lib/home-packages";
import { SITE_URL, absoluteUrl, formatPhone, telHref } from "@/src/lib/site";
import { getSitePhones } from "@/src/lib/site-phones";

export const revalidate = 300;

const loadPackages = cache(getHomePackages);

function lowestPrice(prices: number[]): string {
  return formatPrice(Math.min(...prices));
}

export async function generateMetadata(): Promise<Metadata> {
  const packages = await loadPackages();
  const from = lowestPrice(packages.map((item) => item.price));
  const title = `สมัครเน็ตบ้านทรู ไฟเบอร์ เริ่ม ${from} บาท เช็กพื้นที่ทั่วไทย | True Fiber Home`;
  const description = `สมัครเน็ตบ้านทรูออนไลน์กับตัวแทนจำหน่ายที่ได้รับการแต่งตั้ง เน็ตไฟเบอร์เริ่ม ${from} บาทต่อเดือน พร้อมเราเตอร์ WiFi 6 ส่งตำแหน่งบ้านทาง LINE เพื่อเช็กพื้นที่ติดตั้งได้ทุกจังหวัด`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "/", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const SERVICES = [
  { href: "/monthly", title: "ซิมรายเดือน ทรู ดีแทค", text: "เปิดเบอร์ใหม่ ย้ายค่าย และแพ็กเสริม", cta: "ดูแพ็กเกจรายเดือน" },
  { href: "/topup", title: "ซิมเติมเงิน", text: "โปรเน็ตรายวัน รายสัปดาห์ และ 30 วัน", cta: "ดูโปรเติมเงิน" },
  { href: "/wEnergy", title: "โซล่าเซลล์ W&W Energy", text: "สำรวจหน้างานและติดตั้งสำหรับบ้านและธุรกิจ", cta: "ดูบริการโซล่าเซลล์" },
];

const MARQUEE = ["เน็ตบ้านทรู", "ไฟเบอร์แท้", "500/500 Mbps", "เราเตอร์ WiFi 6"];

export default async function HomePage() {
  const [packages, phones] = await Promise.all([loadPackages(), getSitePhones()]);
  const from = lowestPrice(packages.map((item) => item.price));
  const mainPhone = phones[0];
  const marquee = [...MARQUEE, `เริ่ม ${from} บาท`];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "แพ็กเกจเน็ตบ้านทรูออนไลน์",
      numberOfItems: packages.length,
      itemListElement: packages.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: item.name,
          description: [item.speedLabel, item.termLabel, ...item.perks].filter(Boolean).join(" · "),
          brand: { "@type": "Brand", name: "True Online" },
          offers: {
            "@type": "Offer",
            price: item.price,
            priceCurrency: "THB",
            availability: "https://schema.org/InStock",
            url: absoluteUrl("/#packages"),
          },
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOME_FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "True Fiber Home",
      url: SITE_URL,
      inLanguage: "th",
    },
  ];

  return (
    <div className={tfhClass}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <HomeMotion />

      <HeroMotion plans={buildHeroPlans(packages)} lineHref={lineSupport} />

      <div className="mq" aria-hidden="true">
        <div>
          {[...marquee, ...marquee].map((text, index) => (
            <span key={index}>{text}</span>
          ))}
        </div>
      </div>

      <section id="packages">
        <div className="wrap">
          <PackageGrid packages={packages} />
          <p className="fine">
            ราคายังไม่รวมภาษีมูลค่าเพิ่ม ค่าแรกเข้าและเงื่อนไขขึ้นกับโปรโมชัน ณ วันสมัคร
            เจ้าหน้าที่แจ้งยอดทั้งหมดก่อนยืนยัน{" "}
            <Link href="/broadband" style={{ textDecoration: "underline" }}>
              ดูรายละเอียดโปรเน็ตบ้านทั้งหมด
            </Link>
          </p>
        </div>
      </section>

      <section className="sun" id="chooser">
        <SpeedChooser packages={packages} />
      </section>

      <section id="areas">
        <div className="wrap areas">
          <AreaSection regions={REGIONS} links={areaLinks()}>
            <h2>
              <span className="nb">เช็กพื้นที่ติดเน็ตบ้านทรู</span> <span className="nb">ได้ทุกจังหวัด</span>
            </h2>
            <p className="sub">ส่งตำแหน่งบ้านมา เจ้าหน้าที่เช็กให้ว่าพื้นที่ของคุณติดตั้งได้หรือไม่</p>
          </AreaSection>
        </div>
      </section>

      <section className="redblk">
        <div className="wrap grid2">
          <Image
            className="techimg rv"
            src="/assets/home/k-tech.webp"
            alt="ภาพประกอบ 3 มิติ ช่างติดตั้งเน็ตบ้านถือเราเตอร์และยกนิ้ว"
            width={475}
            height={1088}
            sizes="(max-width: 900px) 70vw, 300px"
          />
          <div className="rv">
            <h2>
              <span className="nb">ติดเน็ตบ้านทรู</span> <span className="nb">4 ขั้นตอน</span>
            </h2>
            <ol className="steps">
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
        </div>
      </section>

      <section>
        <div className="wrap">
          <h2 className="rv">มากกว่าเน็ตบ้าน</h2>
          <div className="svc">
            {SERVICES.map((service) => (
              <Link key={service.href} className="rv" href={service.href}>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <span className="go">
                  {service.cta}
                  <HomeIcon name="arrow" />
                </span>
              </Link>
            ))}
          </div>

          <h2 className="rv" id="faq" style={{ marginTop: 120 }}>
            คำถามก่อนสมัคร
          </h2>
          <div className="faq rv">
            {HOME_FAQ.map((item, index) => (
              <details key={item.q} open={index === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>

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

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cta rv">
            <div>
              <h2>
                <span className="nb">บ้านคุณติดได้ไหม</span> <em className="nb">ถามได้เลย</em>
              </h2>
              <p>ส่งตำแหน่งบ้านมา เจ้าหน้าที่ตอบทาง LINE และโทรศัพท์</p>
              <div className="acts">
                <TrackedLineLink href={lineSupport} source="home_cta" className="btn btn-r">
                  <HomeIcon name="chat" />
                  เช็กพื้นที่ทาง LINE
                </TrackedLineLink>
                <a className="btn btn-l" href={telHref(mainPhone)}>
                  <HomeIcon name="phone" />
                  {formatPhone(mainPhone)}
                </a>
              </div>
            </div>
            <Image
              src="/assets/home/k-router.webp"
              alt="ภาพประกอบ 3 มิติ เราเตอร์ WiFi สีขาว"
              width={679}
              height={713}
              sizes="300px"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
