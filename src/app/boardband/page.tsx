import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/src/lib/prisma";
import { lineSupport } from "@/src/context/line-path";
import ContactSection from "@/src/app/home/components/contact-section";
import BroadbandPromotionsClient from "./BroadbandPromotionsClient";

export const metadata: Metadata = {
  title: "โปรโมทเน็ตแพ็กเกจทั่วไป",
  description: "รวมโปรโมชันและแพ็กเกจเน็ตบ้านยอดนิยม อัปเดตราคา ความเร็ว และสิทธิพิเศษในหน้าเดียว",
  alternates: { canonical: "/boardband" },
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

function getTextItems(value: unknown): string[] {
  const items: string[] = [];

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item === "string") {
        const text = item.trim();
        if (text) items.push(text);
        return;
      }

      if (item && typeof item === "object" && !Array.isArray(item)) {
        const data = item as Record<string, unknown>;
        const textRaw = data.text ?? data.label ?? data.title ?? data.name;
        const text = typeof textRaw === "string" ? textRaw.trim() : "";
        if (text) items.push(text);
      }
    });

    return items;
  }

  if (typeof value === "string" && value.trim()) {
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => items.push(item));
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

  const totalPromotions = promotions.length;
  const promotionCards = promotions.map((promo) => {
    const promoDetails = getTextItems(promo.details);
    const promoPerks = getTextItems(promo.perks);

    return {
      id: promo.id,
      categoryName: promo.categoryName,
      name: promo.name,
      price: promo.price,
      priceNote: promo.priceNote,
      speed: promo.speed,
      validity: promo.validity,
      imageUrl: promo.imageUrl,
      promoBadge: promo.promoBadge,
      buyUrl: promo.buyUrl,
      highlightItems: promoDetails.length > 0 ? promoDetails : promoPerks,
    };
  });

  return (
    <main className="bg-slate-50 min-h-screen pt-28 pb-20">
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl bg-gradient-to-br from-[#1f3fbf] via-[#2f58e9] to-[#4a72ff] text-white p-8 md:p-12 shadow-[0_25px_70px_rgba(37,76,220,0.28)]">
          <p className="text-xs uppercase tracking-[0.22em] text-white/80">internet package showcase</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black leading-tight">
            โปรโมชันเน็ตบ้านยอดนิยม <br className="hidden md:block" /> อัปเดตล่าสุด
          </h1>
          <p className="mt-4 max-w-3xl text-white/90 text-sm md:text-base leading-7">
            รวมข้อเสนอเน็ตบ้านที่คัดมาแล้วทั้งความเร็ว ราคา และสิทธิพิเศษ เปรียบเทียบง่าย สมัครได้ทันที
          </p>
          <div className="mt-3 inline-flex items-center rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm border border-white/30">
            <span className="text-sm md:text-base font-semibold">โปรโมชั่นที่พร้อมสมัครตอนนี้: {totalPromotions} รายการ</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">แพ็กเกจและโปรโมชันเน็ตบ้าน</h2>
          <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700">
            {totalPromotions} รายการ
          </span>
        </div>

        {promotions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">ขณะนี้ยังไม่มีโปรโมชันที่เปิดรับสมัคร กรุณาตรวจสอบอีกครั้งในภายหลัง</p>
            <Link
              href={lineSupport}
              className="inline-flex mt-4 rounded-xl bg-[#2f58e9] px-5 py-2.5 text-white font-semibold hover:bg-[#1f3fbf] transition-colors"
            >
              ติดต่อเจ้าหน้าที่
            </Link>
          </div>
        ) : (
          <BroadbandPromotionsClient promotions={promotionCards} defaultContactUrl={lineSupport} />
        )}
      </section>

      <ContactSection
        sectionId="boardband-contact-section"
        content={{
          title: "ติดต่อและสมัครบริการ",
          subtitle: "เลือกช่องทางที่สะดวก ทีมงานพร้อมให้คำแนะนำแพ็กเกจที่เหมาะกับคุณ",
          isActive: true,
        }}
      />
    </main>
  );
}
