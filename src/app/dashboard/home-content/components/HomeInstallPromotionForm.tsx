"use client";

import { useEffect, useMemo, useState } from "react";
import { lineSupport } from "@/src/context/line-path";

interface HomeSectionData {
  id?: string;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  jsonData?: unknown;
  isActive: boolean;
}

interface Props {
  initialData: HomeSectionData | null;
}

const CTA_LABEL_OPTIONS = ["ตรวจสอบพื้นที่ทางไลน์", "สมัครเลย", "ดูแพ็กเกจ", "ติดต่อเจ้าหน้าที่"];
const CTA_LINK_OPTIONS = [lineSupport, "/service", "/boardband", "/home#packages", "/topup", "/monthly"];

function getJsonData(jsonData: unknown) {
  if (!jsonData || typeof jsonData !== "object" || Array.isArray(jsonData)) {
    return {
      priceText: "499 บาท/เดือน",
      bottomLine: "ทีมงานดูแลครบ จบในที่เดียว",
      primaryButtonLabel: "ตรวจสอบพื้นที่ทางไลน์",
      primaryButtonHref: lineSupport,
      secondaryButtonLabel: "ดูแพ็กเกจ",
      secondaryButtonHref: "/boardband",
      footerText: "ติดตั้งทั่วไทย | ทีมงานมืออาชีพ | บริการรวดเร็ว",
    };
  }

  const data = jsonData as Record<string, unknown>;

  return {
    priceText: typeof data.priceText === "string" ? data.priceText : "499 บาท/เดือน",
    bottomLine: typeof data.bottomLine === "string" ? data.bottomLine : "ทีมงานดูแลครบ จบในที่เดียว",
    primaryButtonLabel: typeof data.primaryButtonLabel === "string" ? data.primaryButtonLabel : "ตรวจสอบพื้นที่ทางไลน์",
    primaryButtonHref:
      typeof data.primaryButtonHref === "string" && data.primaryButtonHref.trim() && data.primaryButtonHref.trim() !== "/service" && data.primaryButtonHref.trim() !== "#"
        ? data.primaryButtonHref.trim()
        : lineSupport,
    secondaryButtonLabel: typeof data.secondaryButtonLabel === "string" ? data.secondaryButtonLabel : "ดูแพ็กเกจ",
    secondaryButtonHref:
      typeof data.secondaryButtonHref === "string" && data.secondaryButtonHref.trim()
        ? data.secondaryButtonHref
        : "/boardband",
    footerText:
      typeof data.footerText === "string"
        ? data.footerText
        : "ติดตั้งทั่วไทย | ทีมงานมืออาชีพ | บริการรวดเร็ว",
  };
}

export default function HomeInstallPromotionForm({ initialData }: Props) {
  const initialJson = useMemo(() => getJsonData(initialData?.jsonData), [initialData?.jsonData]);

  const [title, setTitle] = useState(initialData?.title ?? "ติดเน็ตทรูไฟเบอร์\nเร็ว แรง ครบทุกพื้นที่");
  const [topLine, setTopLine] = useState(initialData?.subtitle ?? "สมัครง่าย ติดตั้งไว เริ่มต้นเพียง");
  const [priceText, setPriceText] = useState(initialJson.priceText);
  const [bottomLine, setBottomLine] = useState(initialJson.bottomLine);
  const [primaryButtonLabel, setPrimaryButtonLabel] = useState(initialJson.primaryButtonLabel);
  const [primaryButtonHref, setPrimaryButtonHref] = useState(initialJson.primaryButtonHref);
  const [secondaryButtonLabel, setSecondaryButtonLabel] = useState(initialJson.secondaryButtonLabel);
  const [secondaryButtonHref, setSecondaryButtonHref] = useState(initialJson.secondaryButtonHref);
  const [footerText, setFooterText] = useState(initialJson.footerText);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const next = getJsonData(initialData?.jsonData);

    setTitle(initialData?.title ?? "ติดเน็ตทรูไฟเบอร์\nเร็ว แรง ครบทุกพื้นที่");
    setTopLine(initialData?.subtitle ?? "สมัครง่าย ติดตั้งไว เริ่มต้นเพียง");
    setPriceText(next.priceText);
    setBottomLine(next.bottomLine);
    setPrimaryButtonLabel(next.primaryButtonLabel);
    setPrimaryButtonHref(next.primaryButtonHref);
    setSecondaryButtonLabel(next.secondaryButtonLabel);
    setSecondaryButtonHref(next.secondaryButtonHref);
    setFooterText(next.footerText);
    setIsActive(initialData?.isActive ?? true);
  }, [initialData]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/home-sections/homeInstallPromotion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: topLine,
          jsonData: {
            priceText,
            bottomLine,
            primaryButtonLabel,
            primaryButtonHref,
            secondaryButtonLabel,
            secondaryButtonHref,
            footerText,
          },
          isActive,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setMessage("บันทึกสำเร็จ!");
    } catch {
      setMessage("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelClass}>หัวข้อหลัก (ใส่ขึ้นบรรทัดใหม่ได้ด้วย Enter)</label>
          <textarea
            className={`${inputClass} min-h-[84px] resize-y`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ติดเน็ตทรูไฟเบอร์\nเร็ว แรง ครบทุกพื้นที่"
          />
        </div>

        <div>
          <label className={labelClass}>บรรทัดคำโปรยด้านบนราคา</label>
          <input
            className={inputClass}
            value={topLine}
            onChange={(e) => setTopLine(e.target.value)}
            placeholder="สมัครง่าย ติดตั้งไว เริ่มต้นเพียง"
          />
        </div>

        <div>
          <label className={labelClass}>ข้อความราคา (ไฮไลต์สีเหลือง)</label>
          <input
            className={inputClass}
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            placeholder="499 บาท/เดือน"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>บรรทัดคำโปรยด้านล่าง</label>
          <input
            className={inputClass}
            value={bottomLine}
            onChange={(e) => setBottomLine(e.target.value)}
            placeholder="ทีมงานดูแลครบ จบในที่เดียว"
          />
        </div>

        <div>
          <label className={labelClass}>ปุ่มหลัก - ข้อความ</label>
          <input
            className={inputClass}
            list="install-promo-label-options"
            value={primaryButtonLabel}
            onChange={(e) => setPrimaryButtonLabel(e.target.value)}
            placeholder="ตรวจสอบพื้นที่ทางไลน์"
          />
        </div>

        <div>
          <label className={labelClass}>ปุ่มหลัก - ลิงก์</label>
          <input
            className={inputClass}
            list="install-promo-link-options"
            value={primaryButtonHref}
            onChange={(e) => setPrimaryButtonHref(e.target.value)}
            placeholder="/service หรือ https://..."
          />
        </div>

        <div>
          <label className={labelClass}>ปุ่มรอง - ข้อความ</label>
          <input
            className={inputClass}
            list="install-promo-label-options"
            value={secondaryButtonLabel}
            onChange={(e) => setSecondaryButtonLabel(e.target.value)}
            placeholder="ดูแพ็กเกจ"
          />
        </div>

        <div>
          <label className={labelClass}>ปุ่มรอง - ลิงก์</label>
          <input
            className={inputClass}
            list="install-promo-link-options"
            value={secondaryButtonHref}
            onChange={(e) => setSecondaryButtonHref(e.target.value)}
            placeholder="/home#packages หรือ https://..."
          />
        </div>

        <datalist id="install-promo-label-options">
          {CTA_LABEL_OPTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>

        <datalist id="install-promo-link-options">
          {CTA_LINK_OPTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>

        <div className="md:col-span-2">
          <label className={labelClass}>ข้อความท้ายการ์ด</label>
          <input
            className={inputClass}
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder="ติดตั้งทั่วไทย | ทีมงานมืออาชีพ | บริการรวดเร็ว"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
        />
        <span className="text-sm text-gray-300">แสดงผล section นี้บนหน้า Home</span>
      </label>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-800 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก Install Promotion"}
        </button>
        {message && (
          <span className={`text-sm ${message.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
