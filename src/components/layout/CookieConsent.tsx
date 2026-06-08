"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_KEY = "cookie-consent-accepted-v2";

type GtagWindow = typeof window & {
  gtag?: (...args: unknown[]) => void;
};

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const accepted = window.localStorage.getItem(COOKIE_KEY) === "true";
    if (accepted) {
      (window as GtagWindow).gtag?.("consent", "update", {
        ad_storage: "granted",
        analytics_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
      return;
    }
    setOpen(true);
  }, []);

  const handleAccept = () => {
    window.localStorage.setItem(COOKIE_KEY, "true");
    (window as GtagWindow).gtag?.("consent", "update", {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
    window.dispatchEvent(new Event("cookie-consent-accepted"));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <aside
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[110] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      aria-label="การตั้งค่าคุกกี้"
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-[780px] flex-col gap-3 rounded-lg border border-white/10 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-md sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            คุกกี้ช่วยวิเคราะห์การใช้งานและวัดผลช่องทางสมัครบริการ อ่านรายละเอียดใน{" "}
            <Link
              href="/termsAndPrivacy"
              className="font-medium text-sky-300 underline underline-offset-2"
            >
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-9 rounded-md border border-slate-600 px-3 text-xs font-semibold text-slate-200 hover:bg-white/5"
          >
            ปิด
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="min-h-9 rounded-md bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            ยอมรับทั้งหมด
          </button>
        </div>
      </div>
    </aside>
  );
}
