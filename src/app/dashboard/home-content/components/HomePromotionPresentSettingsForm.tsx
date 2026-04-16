"use client";

import { useEffect, useState } from "react";

interface HomeSectionData {
  id?: string;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  isActive: boolean;
}

interface Props {
  initialData: HomeSectionData | null;
}

export default function HomePromotionPresentSettingsForm({ initialData }: Props) {
  const [helperText, setHelperText] = useState(initialData?.subtitle ?? "เลื่อนเพื่อดูโปรโมชันทั้งหมด");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setHelperText(initialData?.subtitle ?? "เลื่อนเพื่อดูโปรโมชันทั้งหมด");
    setIsActive(initialData?.isActive ?? true);
  }, [initialData]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/home-sections/homePromotionPresent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtitle: helperText,
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
    <div className="space-y-4 mb-6">
      <div>
        <label className={labelClass}>ข้อความกำกับเหนือการ์ด</label>
        <input
          className={inputClass}
          value={helperText}
          onChange={(e) => setHelperText(e.target.value)}
          placeholder="เลื่อนเพื่อดูโปรโมชันทั้งหมด"
        />
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
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า Promotion Present"}
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
