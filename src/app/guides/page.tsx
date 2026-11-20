import type { Metadata } from "next";
import Link from "next/link";
import "@/src/components/home/home.css";
import "@/src/components/home/area.css";
import "@/src/components/home/guide.css";
import { tfhClass } from "@/src/components/home/fonts";
import { GUIDES } from "@/src/data/guides";
import { absoluteUrl } from "@/src/lib/site";

const title = "คู่มือเน็ตบ้าน เลือกความเร็ว WiFi และการติดตั้ง | True Fiber Home";
const description =
  "คู่มือสำหรับคนกำลังจะติดเน็ตบ้านหรือใช้อยู่แล้วมีปัญหา เลือกความเร็วให้พอดีบ้าน เข้าใจ WiFi 6 และ Mesh แก้เน็ตช้าด้วยตัวเอง และสิ่งที่ต้องเตรียมก่อนช่างเข้าติดตั้ง";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/guides" },
  openGraph: { title, description, url: "/guides", type: "website" },
};

export default function GuidesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "หน้าแรก", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "คู่มือ", item: absoluteUrl("/guides") },
    ],
  };

  return (
    <div className={tfhClass}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="ar-head">
        <div className="wrap">
          <nav className="ar-crumbs" aria-label="เส้นทาง">
            <Link href="/">หน้าแรก</Link>
            <span aria-current="page">คู่มือ</span>
          </nav>
          <h1>
            <span className="nb">คู่มือ</span> <em className="nb">เน็ตบ้าน</em>
          </h1>
          <p className="ar-lead">
            คำตอบสำหรับคำถามที่เจอบ่อยก่อนสมัครและระหว่างใช้งาน เขียนให้อ่านจบแล้วตัดสินใจได้เลย
          </p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <ul className="gd-list">
            {GUIDES.map((guide) => (
              <li key={guide.slug}>
                <Link href={`/guides/${guide.slug}`}>
                  <h2>{guide.title}</h2>
                  <p>{guide.description}</p>
                  <span>อ่านคู่มือนี้</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
