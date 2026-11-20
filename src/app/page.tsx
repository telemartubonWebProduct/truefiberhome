import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Anuphan, Bagel_Fat_One } from "next/font/google";
import "@/src/components/home/home.css";
import AreaSection from "@/src/components/home/AreaSection";
import HomeIcon from "@/src/components/home/HomeIcon";
import HomeMotion from "@/src/components/home/HomeMotion";
import PackageGrid from "@/src/components/home/PackageGrid";
import SpeedChooser from "@/src/components/home/SpeedChooser";
import { formatPrice } from "@/src/components/home/package-art";
import TrackedLineLink from "@/src/app/home/components/TrackedLineLink";
import { lineSupport } from "@/src/context/line-path";
import { HOME_FAQ } from "@/src/data/home-faq";
import { REGIONS } from "@/src/data/provinces";
import { getHomePackages } from "@/src/lib/home-packages";
import { SITE_URL, absoluteUrl, formatPhone, parsePhones, telHref } from "@/src/lib/site";

const anuphan = Anuphan({
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-anuphan",
});

const fat = Bagel_Fat_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-fat",
});

export const revalidate = 300;

const FALLBACK_PHONE = "0639274977";

const loadPackages = cache(getHomePackages);

const loadPhones = cache(async (): Promise<string[]> => {
  try {
    const { prisma } = await import("@/src/lib/prisma");
    const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    const phones = parsePhones(settings?.phone);
    return phones.length > 0 ? phones : [FALLBACK_PHONE];
  } catch {
    return [FALLBACK_PHONE];
  }
});

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

const STEPS = [
  { title: "ส่งตำแหน่งบ้าน", text: "แชร์โลเคชันหรือพิมพ์ที่อยู่ทาง LINE" },
  { title: "เจ้าหน้าที่เช็กคู่สาย", text: "ยืนยันว่ามีสายไฟเบอร์ถึงบ้านคุณ" },
  { title: "เลือกแพ็กเกจ", text: "เทียบราคาและของที่ได้ก่อนตกลง" },
  { title: "นัดวันติดตั้ง", text: "ช่างเข้าติดตั้งตามวันที่คุณสะดวก" },
];

const SERVICES = [
  { href: "/monthly", title: "ซิมรายเดือน ทรู ดีแทค", text: "เปิดเบอร์ใหม่ ย้ายค่าย และแพ็กเสริม", cta: "ดูแพ็กเกจรายเดือน" },
  { href: "/topup", title: "ซิมเติมเงิน", text: "โปรเน็ตรายวัน รายสัปดาห์ และ 30 วัน", cta: "ดูโปรเติมเงิน" },
  { href: "/wEnergy", title: "โซล่าเซลล์ W&W Energy", text: "สำรวจหน้างานและติดตั้งสำหรับบ้านและธุรกิจ", cta: "ดูบริการโซล่าเซลล์" },
];

const MARQUEE = ["เน็ตบ้านทรู", "ไฟเบอร์แท้", "500/500 Mbps", "เราเตอร์ WiFi 6"];

export default async function HomePage() {
  const [packages, phones] = await Promise.all([loadPackages(), loadPhones()]);
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
    <div className={`tfh ${anuphan.variable} ${fat.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <HomeMotion />

      <section className="hero" id="tfh-hero">
        <div className="stage">
          <div className="big" aria-hidden="true">
            <div id="tfh-big">
              <span className="l l0">{from}</span>
              <span className="l l1">{from}</span>
              <span className="l l2">{from}</span>
              <span className="f">{from}</span>
              <b className="unit">บาท/เดือน</b>
            </div>
          </div>
          <Image
            className="who"
            src="/assets/home/k-hero.webp"
            alt="ภาพประกอบ 3 มิติ หญิงสาวนั่งใช้แล็ปท็อปบนเราเตอร์ WiFi"
            width={656}
            height={805}
            sizes="(max-width: 768px) 90vw, 520px"
            priority
          />
          <div className="words" aria-hidden="true">
            <ul id="tfh-words-left">
              <li>ไฟเบอร์แท้</li>
              <li>500/500 Mbps</li>
              <li>WiFi 6</li>
            </ul>
            <ul id="tfh-words-right">
              <li>ดูหนัง</li>
              <li>เล่นเกม</li>
              <li>ประชุมงาน</li>
            </ul>
          </div>
        </div>
        <div className="wrap">
          <div className="panel">
            <div>
              <h1>
                <span className="nb">สมัครเน็ตบ้านทรู</span>{" "}
                <em className="nb">เริ่ม {from} บาท/เดือน</em>
              </h1>
              <p>
                ไฟเบอร์ 500/500 Mbps พร้อมเราเตอร์ WiFi 6 ส่งตำแหน่งบ้านมา
                เจ้าหน้าที่เช็กคู่สายและนัดวันติดตั้งให้
              </p>
            </div>
            <div className="acts">
              <TrackedLineLink href={lineSupport} source="home_hero" className="btn btn-r">
                <HomeIcon name="pin" />
                เช็กพื้นที่ทาง LINE
              </TrackedLineLink>
              <a className="btn btn-l" href="#packages">
                ดูแพ็กเกจ
              </a>
              <p className="trust">
                ดำเนินการโดย บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด
                ตัวแทนจำหน่ายทรูออนไลน์ที่ได้รับการแต่งตั้ง
              </p>
            </div>
          </div>
        </div>
      </section>

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
            <Link href="/boardband" style={{ textDecoration: "underline" }}>
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
          <div className="rv">
            <div className="deck" aria-hidden="true">
              <div>
                <span>
                  เชียงใหม่<small>ภาคเหนือ</small>
                </span>
              </div>
              <div>
                <span>
                  ขอนแก่น<small>ภาคอีสาน</small>
                </span>
              </div>
              <div>
                <span>
                  กรุงเทพมหานคร<small>ภาคกลาง</small>
                </span>
                <Image src="/assets/home/k-house.webp" alt="" width={377} height={340} sizes="150px" />
              </div>
            </div>
          </div>
          <div className="rv">
            <h2>
              <span className="nb">เช็กพื้นที่ติดเน็ตบ้านทรู</span> <span className="nb">ได้ทุกจังหวัด</span>
            </h2>
            <p className="sub">ส่งตำแหน่งบ้านมา เจ้าหน้าที่เช็กให้ว่าพื้นที่ของคุณติดตั้งได้หรือไม่</p>
            <AreaSection regions={REGIONS} />
          </div>
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
              {STEPS.map((step) => (
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
