"use client";

import { useEffect, useMemo, useState } from "react";
import { lineSupport } from "@/src/context/line-path";

interface HomeSectionData {
  id?: string;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  jsonData?: unknown;
  isActive: boolean;
}

interface Props {
  initialData: HomeSectionData | null;
}

const VIDEO_PATH_OPTIONS = ["/assets/mock-vid-main.mp4"];
const HERO_LINK_OPTIONS = [lineSupport, "/service", "/boardband", "/home#packages"];

function getButtonData(jsonData: unknown): { buttonLabel: string; buttonHref: string } {
  if (!jsonData || typeof jsonData !== "object" || Array.isArray(jsonData)) {
    return { buttonLabel: "สมัครเลยวันนี้", buttonHref: lineSupport };
  }

  const data = jsonData as Record<string, unknown>;
  const buttonLabel = typeof data.buttonLabel === "string" ? data.buttonLabel : "สมัครเลยวันนี้";
  const buttonHref =
    typeof data.buttonHref === "string" && data.buttonHref.trim() && data.buttonHref.trim() !== "/service" && data.buttonHref.trim() !== "#"
      ? data.buttonHref.trim()
      : lineSupport;

  return { buttonLabel, buttonHref };
}

export default function HomeHeroVideoForm({ initialData }: Props) {
  const initialButton = useMemo(() => getButtonData(initialData?.jsonData), [initialData?.jsonData]);

  const [title, setTitle] = useState(
    initialData?.title ?? "สัมผัสความเร็วเหนือระดับ กับเน็ตทรูไฟเบอร์"
  );
  const [subtitle, setSubtitle] = useState(
    initialData?.subtitle ??
      "ลื่นไหล ไม่มีสะดุด ตอบโจทย์ทุกไลฟ์สไตล์ ทั้งทำงาน ดูหนัง เล่นเกม พร้อมเต็มอิ่มกับความบันเทิงระดับพรีเมียม"
  );
  const [videoUrl, setVideoUrl] = useState(initialData?.imageUrl ?? "/assets/mock-vid-main.mp4");
  const [buttonLabel, setButtonLabel] = useState(initialButton.buttonLabel);
  const [buttonHref, setButtonHref] = useState(initialButton.buttonHref);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const buttonData = getButtonData(initialData?.jsonData);
    setTitle(initialData?.title ?? "สัมผัสความเร็วเหนือระดับ กับเน็ตทรูไฟเบอร์");
    setSubtitle(
      initialData?.subtitle ??
        "ลื่นไหล ไม่มีสะดุด ตอบโจทย์ทุกไลฟ์สไตล์ ทั้งทำงาน ดูหนัง เล่นเกม พร้อมเต็มอิ่มกับความบันเทิงระดับพรีเมียม"
    );
    setVideoUrl(initialData?.imageUrl ?? "/assets/mock-vid-main.mp4");
    setButtonLabel(buttonData.buttonLabel);
    setButtonHref(buttonData.buttonHref);
    setIsActive(initialData?.isActive ?? true);
  }, [initialData]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/home-sections/homeHeroVideo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          imageUrl: videoUrl,
          jsonData: {
            buttonLabel,
            buttonHref,
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
          <label className={labelClass}>หัวข้อหลัก</label>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="สัมผัสความเร็วเหนือระดับ กับเน็ตทรูไฟเบอร์"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>คำอธิบาย</label>
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="รายละเอียดข้อความใต้หัวข้อ"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Video URL / Path</label>
          <input
            className={inputClass}
            list="home-hero-video-options"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="/assets/mock-vid-main.mp4 หรือ https://..."
          />
          <datalist id="home-hero-video-options">
            {VIDEO_PATH_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={labelClass}>ข้อความปุ่ม</label>
          <input
            className={inputClass}
            value={buttonLabel}
            onChange={(e) => setButtonLabel(e.target.value)}
            placeholder="สมัครเลยวันนี้"
          />
        </div>

        <div>
          <label className={labelClass}>ลิงก์ปุ่ม</label>
          <input
            className={inputClass}
            list="home-hero-link-options"
            value={buttonHref}
            onChange={(e) => setButtonHref(e.target.value)}
            placeholder="/service หรือ https://..."
          />
          <datalist id="home-hero-link-options">
            {HERO_LINK_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
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
          {saving ? "กำลังบันทึก..." : "บันทึก Hero Video"}
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
