import type { Metadata } from "next";
import Link from "next/link";
import "@/src/components/home/home.css";
import "@/src/components/home/area.css";
import HomeIcon from "@/src/components/home/HomeIcon";
import { tfhClass } from "@/src/components/home/fonts";
import TrackedLineLink from "@/src/app/home/components/TrackedLineLink";
import { lineSupport } from "@/src/context/line-path";
import { REGIONS } from "@/src/data/provinces";
import { LISTED_AREAS, areaPath, districtUnit } from "@/src/lib/areas";
import { absoluteUrl } from "@/src/lib/site";

const title = "พื้นที่ให้บริการเน็ตบ้านทรู เช็กพื้นที่ติดตั้งรายจังหวัด | True Fiber Home";
const description =
  "เลือกจังหวัดเพื่อดูอำเภอที่ส่งตำแหน่งมาเช็กพื้นที่ติดตั้งเน็ตบ้านทรูได้ พร้อมแพ็กเกจและขั้นตอนสมัคร เจ้าหน้าที่เช็กคู่สายตามที่อยู่จริงทาง LINE";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/areas" },
  openGraph: { title, description, url: "/areas", type: "website" },
};

export default function AreasPage() {
  const bySlugName = new Map(LISTED_AREAS.map((area) => [area.name, area]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "หน้าแรก", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "พื้นที่ให้บริการ", item: absoluteUrl("/areas") },
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
            <span aria-current="page">พื้นที่ให้บริการ</span>
          </nav>
          <h1>
            <span className="nb">พื้นที่ให้บริการ</span> <em className="nb">เน็ตบ้านทรู</em>
          </h1>
          <p className="ar-lead">
            เลือกจังหวัดของคุณเพื่อดูรายชื่ออำเภอและแพ็กเกจ หรือส่งตำแหน่งบ้านทาง LINE
            ให้เจ้าหน้าที่เช็กคู่สายได้เลย
          </p>
          <div className="ar-acts">
            <TrackedLineLink href={lineSupport} source="areas_hub" className="btn btn-k">
              <HomeIcon name="pin" />
              เช็กพื้นที่ทาง LINE
            </TrackedLineLink>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap ar-regions">
          {REGIONS.map((region) => (
            <div key={region.name}>
              <h2>{region.name}</h2>
              <ul className="prov">
                {[...region.provinces]
                  .sort((a, b) => a.localeCompare(b, "th"))
                  .map((province) => {
                    const area = bySlugName.get(province);
                    return (
                      <li key={province}>
                        {area ? (
                          <Link href={areaPath(area)}>
                            {province}
                            <small>
                              {area.districts.length} {districtUnit(area)}
                            </small>
                          </Link>
                        ) : (
                          province
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
