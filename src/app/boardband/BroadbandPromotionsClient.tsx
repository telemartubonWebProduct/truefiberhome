"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import FacebookIcon from "@/src/assets/icons/facebook-icon.svg";
import LineIcon from "@/src/assets/icons/line-icon.svg";
import PhoneIcon from "@/src/assets/icons/phone-icon.svg";
import {
  trackFacebookClick,
  trackLineClick,
  trackPhoneClick,
  trackSignupInterest,
} from "@/src/lib/track-event";
import { safeLink } from "@/src/lib/api-normalize";

type PromotionBenefitItem = {
  label: string;
  imageUrl: string | null;
};

type PromotionCardItem = {
  id: string;
  categoryName: string | null;
  name: string;
  price: number;
  priceNote: string | null;
  speed: string | null;
  validity: string | null;
  imageUrl: string | null;
  promoBadge: string | null;
  buyUrl: string | null;
  benefitItems: PromotionBenefitItem[];
};

type BroadbandPromotionsClientProps = {
  promotions: PromotionCardItem[];
  categories?: string[];
  defaultContactUrl: string;
};

const phoneNumber = "0910192552";
const phoneHref = `tel:${phoneNumber}`;
const facebookHref = "https://www.facebook.com/profile.php?id=61558200500505";

function normalizeBuyUrl(value: string | null | undefined): string | null {
  const normalized = safeLink(value);
  if (!normalized || normalized === "/service" || normalized === "#") return null;
  return normalized;
}

function splitSpeed(speed: string | null) {
  const matches = (speed || "").match(/(\d[\d,]*)\s*(?:Mbps)?\s*[/|x]\s*(\d[\d,]*)/i);
  if (!matches) return { download: speed || "-", upload: null };
  return { download: matches[1], upload: matches[2] };
}

function PromotionCardImage({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority: boolean;
}) {
  return (
    <div className="relative aspect-[3/1] w-full overflow-hidden border-b border-slate-200 bg-[#edf3ff]">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover object-center"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
      />
    </div>
  );
}

function BroadbandPromotionsClientInner({
  promotions,
  categories = [],
  defaultContactUrl,
}: BroadbandPromotionsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState(categoryParam || "all");
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionCardItem | null>(null);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setActiveCategory((current) => (category === current ? current : category));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedPromotion) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedPromotion(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEscape);
    };
  }, [selectedPromotion]);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    const params = new URLSearchParams(searchParams.toString());
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  };

  const filteredPromotions =
    activeCategory === "all"
      ? promotions
      : promotions.filter((promotion) =>
          promotion.categoryName
            ?.split(",")
            .map((category) => category.trim())
            .includes(activeCategory)
        );

  const selectedBuyUrl = normalizeBuyUrl(selectedPromotion?.buyUrl);
  const safeDefaultContactUrl = safeLink(defaultContactUrl) || "/service";

  return (
    <>
      {categories.length > 0 ? (
        <div
          className="mb-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:pb-0"
          aria-label="กรองแพ็กเกจตามหมวดหมู่"
        >
          {["all", ...categories].map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                id={`category-tab-${category.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => handleCategoryClick(category)}
                aria-pressed={active}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-bold transition-colors ${
                  active
                    ? "border-[#2864dc] bg-[#2864dc] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {category === "all" ? "ทั้งหมด" : category}
              </button>
            );
          })}
        </div>
      ) : null}

      {filteredPromotions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          ยังไม่มีโปรโมชันในหมวดหมู่นี้
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPromotions.map((promotion, promotionIndex) => {
            const speed = splitSpeed(promotion.speed);

            return (
              <article
                key={promotion.id}
                className="flex min-h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.1)]"
              >
                {promotion.imageUrl ? (
                  <PromotionCardImage
                    src={promotion.imageUrl}
                    alt={promotion.name}
                    priority={promotionIndex < 3}
                  />
                ) : (
                  <div className="aspect-[3/1] border-b border-slate-200 bg-[#edf3ff]" />
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex min-h-[78px] items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase text-slate-500">
                        {promotion.categoryName || "โปรเน็ตบ้าน"}
                      </p>
                      <h3 className="mt-1 text-xl font-black leading-snug text-slate-950">
                        {promotion.name}
                      </h3>
                    </div>
                    {promotion.promoBadge ? (
                      <span className="max-w-[48%] shrink-0 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-center text-[10px] font-bold leading-snug text-red-600">
                        {promotion.promoBadge}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 border-y border-slate-200 py-4">
                    <p className="text-sm font-bold text-slate-700">
                      ความเร็ว (ดาวน์โหลด/อัปโหลด)
                    </p>
                    <div className="mt-2 flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-[34px] font-black leading-none text-slate-800">
                          {speed.download}
                          <span className="ml-0.5 text-base font-bold">Mbps</span>
                        </p>
                        {speed.upload ? (
                          <p className="mt-1 text-lg font-black leading-none text-slate-700">
                            /{speed.upload}
                            <span className="ml-0.5 text-sm font-bold">Mbps</span>
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="whitespace-nowrap text-[32px] font-black leading-none text-[#2864dc]">
                          {Number(promotion.price).toLocaleString("th-TH")}
                        </p>
                        <p className="text-sm font-bold leading-tight text-[#2864dc]">
                          บาท/เดือน
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-slate-500">
                      {promotion.validity ||
                        promotion.priceNote ||
                        "ระยะเวลาและเงื่อนไขเป็นไปตามที่บริษัทกำหนด"}
                    </p>
                  </div>

                  {promotion.benefitItems.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-base font-black text-slate-800">รับทันที!</p>
                      <ul className="mt-2 divide-y divide-slate-100">
                        {promotion.benefitItems.slice(0, 5).map((item, index) => (
                          <li
                            key={`${promotion.id}-benefit-${index}`}
                            className="flex min-h-11 items-center gap-3 py-2 text-sm text-slate-700"
                          >
                            {item.imageUrl ? (
                              <span className="relative h-8 w-10 shrink-0">
                                <Image
                                  src={item.imageUrl}
                                  alt=""
                                  fill
                                  className="object-contain"
                                  sizes="40px"
                                />
                              </span>
                            ) : (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#2864dc]" />
                            )}
                            <span className="leading-snug">{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      trackSignupInterest("broadband", promotion.name);
                      setSelectedPromotion(promotion);
                    }}
                    aria-label={`เช็กพื้นที่และสมัคร ${promotion.name}`}
                    className="mt-auto inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#2864dc] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1649bd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2864dc]"
                  >
                    เช็กพื้นที่และสมัครแพ็กเกจนี้
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedPromotion ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="boardband-modal-title"
          onClick={() => setSelectedPromotion(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="boardband-modal-title" className="text-xl font-black text-slate-900">
              สมัครแพ็กเกจ {selectedPromotion.name}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              เลือกช่องทางที่สะดวก ทีมงานจะเช็กพื้นที่และยืนยันรายละเอียดโปรโมชันให้ทันที
            </p>

            <div className="mt-5 space-y-3">
              <a
                href={selectedBuyUrl || safeDefaultContactUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackLineClick("broadband_modal", selectedBuyUrl || defaultContactUrl)
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00B900] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#009f00]"
              >
                <Image src={LineIcon} alt="" width={20} height={20} className="h-5 w-5" />
                <span>เช็กพื้นที่ผ่าน LINE</span>
              </a>
              <a
                href={phoneHref}
                onClick={() => trackPhoneClick("broadband_modal", phoneNumber)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              >
                <Image src={PhoneIcon} alt="" width={20} height={20} className="h-5 w-5" />
                <span>โทรสมัคร {phoneNumber}</span>
              </a>
              <a
                href={facebookHref}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackFacebookClick("broadband_modal", facebookHref)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1668d3]"
              >
                <Image src={FacebookIcon} alt="" width={20} height={20} className="h-5 w-5" />
                <span>ติดต่อผ่าน Facebook</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPromotion(null)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function BroadbandPromotionsClient(
  props: BroadbandPromotionsClientProps
) {
  return (
    <Suspense
      fallback={
        <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[560px] rounded-lg bg-slate-200" />
          ))}
        </div>
      }
    >
      <BroadbandPromotionsClientInner {...props} />
    </Suspense>
  );
}
