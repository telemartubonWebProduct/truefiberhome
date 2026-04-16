"use client";

import { useState, useRef, useEffect } from "react";
import { uploadBannerImage } from "@/src/lib/storage";
import { lineSupport } from "@/src/context/line-path";

interface HomeSectionData {
  id?: string;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  jsonData: any;
  isActive: boolean;
}

interface Props {
  sectionKey: string;
  sectionLabel: string;
  sectionDescription: string;
  initialData: HomeSectionData | null;
  /** Field config: which fields are relevant for this section */
  fields: ("title" | "subtitle" | "imageUrl" | "linkUrl" | "jsonItems")[];
  /** Labels for JSON items fields */
  jsonItemFields?: { key: string; label: string; type: "text" | "number" }[];
}

const GENERIC_LINK_OPTIONS = [lineSupport, "/service", "/boardband", "/topup", "/monthly", "/wEnergy", "/home"];

export default function HomeSectionEditor({
  sectionKey,
  sectionLabel,
  sectionDescription,
  initialData,
  fields,
  jsonItemFields = [],
}: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [linkUrl, setLinkUrl] = useState(initialData?.linkUrl ?? "");
  const [jsonItems, setJsonItems] = useState<any[]>(
    Array.isArray(initialData?.jsonData) ? initialData.jsonData : []
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Sync state when props change (after router.refresh())
  useEffect(() => {
    setTitle(initialData?.title ?? "");
    setSubtitle(initialData?.subtitle ?? "");
    setImageUrl(initialData?.imageUrl ?? "");
    setLinkUrl(initialData?.linkUrl ?? "");
    setJsonItems(Array.isArray(initialData?.jsonData) ? initialData.jsonData : []);
    setIsActive(initialData?.isActive ?? true);
  }, [initialData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImageUrl(previewUrl);
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      let finalImageUrl = imageUrl || null;
      if (imageFile) {
        finalImageUrl = await uploadBannerImage(imageFile);
      } else if (imageUrl && !imageUrl.includes("blob:")) {
        finalImageUrl = imageUrl;
      } else if (imageUrl?.includes("blob:")) {
        finalImageUrl = null;
      }

      const payload: any = { sectionKey, isActive };
      if (fields.includes("title")) payload.title = title || null;
      if (fields.includes("subtitle")) payload.subtitle = subtitle || null;
      if (fields.includes("imageUrl")) payload.imageUrl = finalImageUrl;
      if (fields.includes("linkUrl")) payload.linkUrl = linkUrl || null;
      if (fields.includes("jsonItems")) payload.jsonData = jsonItems;

      const res = await fetch(`/api/home-sections/${sectionKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("บันทึกสำเร็จ!");
    } catch {
      setMessage("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    const newItem: any = {};
    jsonItemFields.forEach((f) => {
      newItem[f.key] = f.type === "number" ? 0 : "";
    });
    setJsonItems([...jsonItems, newItem]);
  };

  const removeItem = (index: number) => {
    setJsonItems(jsonItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, key: string, value: any) => {
    const updated = [...jsonItems];
    updated[index] = { ...updated[index], [key]: value };
    setJsonItems(updated);
  };

  const inputClass = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{sectionDescription}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
          />
          <span className="text-sm text-gray-300">แสดงผล</span>
        </label>
      </div>

      {/* Basic fields */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        
        {fields.includes("imageUrl") && (
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <label className={labelClass}>รูปภาพเสริม (Image URL หรือ อัปโหลด)</label>
            <div className="mb-3">
              <input
                className={inputClass}
                value={!imageFile && imageUrl && !imageUrl.includes("blob:") ? imageUrl : ""}
                onChange={(e) => {
                  const url = e.target.value;
                  setImageFile(null);
                  setImageUrl(url);
                }}
                placeholder="https://... หรือคลิกอัปโหลดด้านล่าง"
              />
            </div>

            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-800 flex flex-col items-center p-3 h-32">
                <img src={imageUrl} alt="Preview" className="h-full object-contain" />
                <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="absolute bottom-1 right-2 left-2 flex justify-between">
                  <span className="text-[10px] text-gray-400 bg-gray-900/80 px-1.5 rounded truncate max-w-[120px]">
                    {imageFile ? imageFile.name : "External URL / Existing"}
                  </span>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] text-blue-400 bg-gray-900/80 px-1.5 rounded">
                    อัปโหลดรูปใหม่
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg p-6 text-center cursor-pointer h-32 flex flex-col justify-center items-center h-28">
                <svg className="w-6 h-6 text-gray-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                <p className="text-xs text-gray-400">ลากไฟล์มาวาง หรือ คลิกเพื่อเลือกรูป</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 content-start">
          {fields.includes("title") && (
            <div>
              <label className={labelClass}>หัวข้อ (Title)</label>
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="หัวข้อ..." />
            </div>
          )}
          {fields.includes("subtitle") && (
            <div>
              <label className={labelClass}>หัวข้อรอง (Subtitle)</label>
              <input className={inputClass} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="หัวข้อรอง..." />
            </div>
          )}
          {fields.includes("linkUrl") && (
            <div>
              <label className={labelClass}>ลิงก์ (URL)</label>
              <input className={inputClass} list="home-section-link-options" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
              <datalist id="home-section-link-options">
                {GENERIC_LINK_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
          )}
        </div>
      </div>

      {/* JSON Items */}
      {fields.includes("jsonItems") && jsonItemFields.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-300">รายการ ({jsonItems.length})</h4>
            <button onClick={addItem} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              เพิ่มรายการ
            </button>
          </div>

          {jsonItems.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
              <span className="text-gray-600 text-xs font-mono pt-2">{idx + 1}</span>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {jsonItemFields.map((field) => (
                  <div key={field.key}>
                    <label className={labelClass}>{field.label}</label>
                    <input
                      className={inputClass}
                      type={field.type}
                      value={item[field.key] ?? ""}
                      onChange={(e) =>
                         updateItem(idx, field.key, field.type === "number" ? Number(e.target.value) : e.target.value)
                      }
                      placeholder={field.label}
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => removeItem(idx)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-5 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}

          {jsonItems.length === 0 && (
            <p className="text-gray-500 text-xs text-center py-4 border border-dashed border-gray-700 rounded-lg">ยังไม่มีรายการ — กดปุ่ม &ldquo;เพิ่มรายการ&rdquo; เพื่อเริ่มต้น</p>
          )}
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-800 mt-4 h-full pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : `บันทึก ${sectionLabel}`}
        </button>
        {message && (
          <span className={`text-sm ${message.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}>{message}</span>
        )}
      </div>
    </div>
  );
}
