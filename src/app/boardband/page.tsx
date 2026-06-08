import type { Metadata } from "next";
import Link from "next/link";
import ContactSection from "@/src/app/home/components/contact-section";
import { lineSupport } from "@/src/context/line-path";
import { prisma } from "@/src/lib/prisma";
import BroadbandPromotionsClient from "./BroadbandPromotionsClient";

export const metadata: Metadata = {
  title: "โปรเน็ตบ้านทรู แพ็กเกจล่าสุด",
  description:
    "เปรียบเทียบโปรเน็ตบ้านทรู ความเร็ว ราคา และสิทธิพิเศษล่าสุด พร้อมเช็กพื้นที่ติดตั้งและสมัครกับทีมงาน True Fiber Home",
  alternates: { canonical: "/boardband" },
  openGraph: {
    title: "โปรเน็ตบ้านทรู แพ็กเกจล่าสุด | True Fiber Home",
    description:
      "รวมแพ็กเกจเน็ตบ้านทรู ราคาและสิทธิพิเศษล่าสุด เช็กพื้นที่และสมัครได้ทันที ",
    url: "/boardband",
    type: "website",
  },
};

type PromotionItem = {
  id: string;
  type: string;
  categoryName: string | null;
  name: string;
  price: number;
  priceNote: string | null;
  speed: string | null;
  validity: string | null;
  imageUrl: string | null;
  promoBadge: string | null;
  perks: unknown;
  details: unknown;
  buyUrl: string | null;
  status: boolean;
  displayOrder: number;
};

type BenefitItem = {
  label: string;
  imageUrl: string | null;
};

function getBenefitItems(value: unknown): BenefitItem[] {
  const items: BenefitItem[] = [];

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item === "string") {
        const label = item.trim();
        if (label) items.push({ label, imageUrl: null });
        return;
      }

      if (item && typeof item === "object" && !Array.isArray(item)) {
        const data = item as Record<string, unknown>;
        const labelRaw = data.text ?? data.label ?? data.title ?? data.name;
        const imageRaw = data.imageUrl ?? data.image;
        const label = typeof labelRaw === "string" ? labelRaw.trim() : "";
        const imageUrl =
          typeof imageRaw === "string" && imageRaw.trim() ? imageRaw.trim() : null;
        if (label) items.push({ label, imageUrl });
      }
    });
    return items;
  }

  if (typeof value === "string") {
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((label) => items.push({ label, imageUrl: null }));
  }

  return items;
}

export const revalidate = 60;

export default async function BroadbandPage() {
  const promotionDelegate = (prisma as any).promotion;
  const promotions: PromotionItem[] = promotionDelegate
    ? await promotionDelegate.findMany({
        where: { status: true, type: "broadband" },
        orderBy: { displayOrder: "asc" },
      })
    : [];

  const promotionCards = promotions.map((promotion) => {
    const perks = getBenefitItems(promotion.perks);
    const details = getBenefitItems(promotion.details);

    return {
      id: promotion.id,
      categoryName: promotion.categoryName,
      name: promotion.name,
      price: promotion.price,
      priceNote: promotion.priceNote,
      speed: promotion.speed,
      validity: promotion.validity,
      imageUrl: promotion.imageUrl,
      promoBadge: promotion.promoBadge,
      buyUrl: promotion.buyUrl,
      benefitItems: perks.length > 0 ? perks : details,
    };
  });

  const categories = Array.from(
    new Set(
      promotions.flatMap((promotion) =>
        promotion.categoryName
          ? promotion.categoryName
              .split(",")
              .map((category) => category.trim())
              .filter(Boolean)
          : []
      )
    )
  );

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "แพ็กเกจเน็ตบ้านทรู",
    numberOfItems: promotions.length,
    itemListElement: promotions.map((promotion, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: promotion.name,
        image: promotion.imageUrl || undefined,
        category: promotion.categoryName || "โปรเน็ตบ้าน",
        offers: {
          "@type": "Offer",
          priceCurrency: "THB",
          price: promotion.price,
          availability: "https://schema.org/InStock",
          url: promotion.buyUrl || "https://truefiberhome.com/boardband",
        },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] pb-20 pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <section className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black leading-tight text-slate-950 md:text-4xl">
            แพ็กเกจเน็ตบ้านที่ตอบโจทย์ไลฟ์สไตล์คุณ
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
            เปรียบเทียบความเร็ว ราคา และสิทธิพิเศษล่าสุด
            พร้อมเช็กพื้นที่ติดตั้งกับทีมงานได้ทันที
          </p>
        </div>

        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-900 md:text-2xl">
            โปรเน็ตบ้านและแพ็กเกจแนะนำ
          </h2>
          <span className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700">
            {promotions.length} รายการ
          </span>
        </div>

        {promotions.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">
              ขณะนี้ยังไม่มีโปรโมชันที่เปิดรับสมัคร กรุณาตรวจสอบอีกครั้งภายหลัง
            </p>
            <Link
              href={lineSupport}
              className="mt-4 inline-flex rounded-lg bg-[#2864dc] px-5 py-2.5 font-semibold text-white transition-colors hover:bg-[#1649bd]"
            >
              ติดต่อเจ้าหน้าที่
            </Link>
          </div>
        ) : (
          <BroadbandPromotionsClient
            promotions={promotionCards}
            categories={categories}
            defaultContactUrl={lineSupport}
          />
        )}
      </section>

      <ContactSection
        sectionId="boardband-contact-section"
        content={{
          title: "ติดต่อและสมัครบริการ",
          subtitle: "เลือกช่องทางที่สะดวก ทีมงานพร้อมแนะนำแพ็กเกจที่เหมาะกับคุณ",
          isActive: true,
        }}
      />
    </div>
  );
}
