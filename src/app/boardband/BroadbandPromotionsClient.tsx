"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import LocalPhoneRoundedIcon from "@mui/icons-material/LocalPhoneRounded";
import LineIcon from "@/src/assets/icons/line-icon.svg";
import FacebookIconSvg from "@/src/assets/icons/facebook-icon.svg";

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
  highlightItems: string[];
};

type BroadbandPromotionsClientProps = {
  promotions: PromotionCardItem[];
  defaultContactUrl: string;
};

const phoneHref = "tel:021234567";
const facebookHref = "https://www.facebook.com/profile.php?id=61558200500505";

function normalizeBuyUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/service" || trimmed === "#") {
    return null;
  }

  return trimmed;
}

export default function BroadbandPromotionsClient({ promotions, defaultContactUrl }: BroadbandPromotionsClientProps) {
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionCardItem | null>(null);

  useEffect(() => {
    if (!selectedPromotion) {
      return;
    }

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPromotion(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEsc);
    };
  }, [selectedPromotion]);

  const selectedBuyUrl = normalizeBuyUrl(selectedPromotion?.buyUrl);

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {promotions.map((promo) => (
          <article
            key={promo.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_18px_36px_rgba(15,23,42,0.1)]"
          >
            {promo.imageUrl && (
              <div className="mb-4 h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <img src={promo.imageUrl} alt={promo.name} className="h-full w-full object-cover" />
              </div>
            )}

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{promo.categoryName || "โปรโมชั่นเน็ตบ้าน"}</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">{promo.name}</h3>
              </div>
              {promo.promoBadge && (
                <span className="shrink-0 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                  {promo.promoBadge}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-end justify-between rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">ข้อมูลหลัก</p>
                <p className="text-xl font-black leading-tight text-slate-900">{promo.speed || "-"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{promo.validity || "ระยะเวลาตามเงื่อนไข"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">ราคา</p>
                <p className="text-3xl font-black leading-none text-[#2f58e9]">฿{Number(promo.price).toLocaleString()}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{promo.priceNote || "ต่อแพ็กเกจ"}</p>
              </div>
            </div>

            {promo.highlightItems.length > 0 && (
              <ul className="mt-4 space-y-2">
                {promo.highlightItems.slice(0, 4).map((item, idx) => (
                  <li key={`${promo.id}-highlight-${idx}`} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#2f58e9]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => setSelectedPromotion(promo)}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#2f58e9] px-4 py-3 font-bold text-white transition-colors hover:bg-[#1f3fbf]"
            >
              สนใจสมัครโปรโมชันนี้
            </button>
          </article>
        ))}
      </div>

      {selectedPromotion && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="boardband-modal-title"
          onClick={() => setSelectedPromotion(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="boardband-modal-title" className="text-xl font-black text-slate-900">
              สมัครโปรโมชัน {selectedPromotion.name}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              เลือกช่องทางที่สะดวก ทีมงานพร้อมช่วยแนะนำและยืนยันรายละเอียดโปรโมชันให้ทันที
            </p>

            <div className="mt-5 space-y-3">
              <a
                href={selectedBuyUrl || defaultContactUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00B900] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#009f00]"
              >
                <Image src={LineIcon} alt="Line" width={20} height={20} className="h-5 w-5 object-contain" />
                <span>ติดต่อผ่าน LINE</span>
              </a>
              <a
                href={phoneHref}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-900 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
                  <LocalPhoneRoundedIcon className="!text-sm" />
                </span>
                <span>โทรสมัคร 02-123-4567</span>
              </a>
              <a
                href={facebookHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1668d3]"
              >
                <Image src={FacebookIconSvg} alt="Facebook" width={20} height={20} className="h-5 w-5 object-contain" />
                <span>ติดต่อผ่าน Facebook</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPromotion(null)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
