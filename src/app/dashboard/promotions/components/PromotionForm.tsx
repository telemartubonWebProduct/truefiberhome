"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { uploadBannerImage } from "@/src/lib/storage";
import { lineSupport } from "@/src/context/line-path";

interface Promotion {
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
  perks: unknown | null;
  details: unknown | null;
  buyUrl?: string | null;
  status: boolean;
  displayOrder: number;
}

interface PromotionFormProps {
  promotion?: Promotion | null;
  activeType: string;
  lockType?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS: Record<string, string[]> = {
  broadband: ["Starter", "Value", "Premium", "Gigabit"],
  monthly: [
    "เน็ตเพิ่มสปีด",
    "เน็ตไม่จำกัด",
    "เน็ตเล่นโซเซียล",
    "โทร",
    "ซีรีส์ & เอนเตอร์เทนเมนท์",
    "ความคุ้มครอง",
    "เกม & ไลฟ์สไตล์",
  ],
  topup: ["เน็ต", "เน็ต + โทร", "โทร", "เอ็นเตอร์เทนเมนท์", "เกมส์", "insurance"],
  solar: ["S Pack", "M Pack", "L Pack", "XL Pack", "Commercial"],
};

const BADGE_OPTIONS = ["แนะนำ🔥", "ขายดี", "ใหม่", "คุ้มสุด", "ฮิต", "โปรแรง"];
const SPEED_OPTIONS: Record<string, string[]> = {
  broadband: ["300/300 Mbps", "500/500 Mbps", "1000/1000 Mbps"],
  monthly: ["20GB", "30GB", "60GB", "ไม่จำกัด"],
  topup: ["5GB", "10GB", "20GB", "30GB"],
  solar: ["5kW", "8kW", "10kW", "15kW"],
};
const VALIDITY_OPTIONS = ["7 วัน", "15 วัน", "30 วัน", "90 วัน", "12 เดือน", "24 เดือน"];
const BUY_URL_OPTIONS = [lineSupport, "/service", "/boardband", "/topup", "/monthly", "/wEnergy"];

export default function PromotionForm({ promotion, activeType, lockType = false, onSuccess, onCancel }: PromotionFormProps) {
  const isEditing = !!promotion;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState(lockType ? activeType : promotion?.type || activeType);
  const [categoryName, setCategoryName] = useState(promotion?.categoryName || "");
  const [name, setName] = useState(promotion?.name || "");
  const [price, setPrice] = useState(promotion?.price?.toString() || "");
  const [priceNote, setPriceNote] = useState(promotion?.priceNote || "");
  const [speed, setSpeed] = useState(promotion?.speed || "");
  const [validity, setValidity] = useState(promotion?.validity || "");
  const [promoBadge, setPromoBadge] = useState(promotion?.promoBadge || "");
  const [buyUrl, setBuyUrl] = useState(promotion?.buyUrl || "");
  const [status, setStatus] = useState(promotion?.status ?? true);
  const [displayOrder, setDisplayOrder] = useState(promotion?.displayOrder || 0);

  // Array states for JSON fields (perks typically have text and imageUrl)
  const [perks, setPerks] = useState<{ text: string; imageUrl?: string }[]>(() => {
    if (Array.isArray(promotion?.perks)) return promotion.perks;
    return [{ text: "", imageUrl: "" }];
  });

  const [details, setDetails] = useState<string[]>(() => {
    if (Array.isArray(promotion?.details)) return promotion.details;
    return [""];
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(promotion?.imageUrl || null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categoryOptions = CATEGORY_OPTIONS[type] || [];
  const speedOptions = SPEED_OPTIONS[type] || [];
  const categoryListId = `promotion-category-options-${type || "default"}`;
  const speedListId = `promotion-speed-options-${type || "default"}`;

  useEffect(() => {
    if (lockType) {
      setType(activeType);
    }
  }, [lockType, activeType]);

  const handleAddPerk = () => {
    setPerks((prev) => [...prev, { text: "", imageUrl: "" }]);
  };

  const handleRemovePerk = (index: number) => {
    setPerks((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePerkChange = (index: number, field: "text" | "imageUrl", value: string) => {
    setPerks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddDetail = () => setDetails((prev) => [...prev, ""]);
  const handleRemoveDetail = (index: number) => setDetails((prev) => prev.filter((_, i) => i !== index));
  const handleDetailChange = (index: number, value: string) => {
    setDetails((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let finalImageUrl = promotion?.imageUrl || "";

      if (imageFile) {
        finalImageUrl = await uploadBannerImage(imageFile);
      }

      const body = {
        type: lockType ? activeType : type,
        categoryName: categoryName || null,
        name,
        price: parseFloat(price) || 0,
        priceNote: priceNote || null,
        speed: speed || null,
        validity: validity || null,
        imageUrl: imageFile ? finalImageUrl : (imagePreview ? (imagePreview.includes("blob:") ? finalImageUrl : imagePreview) : null),
        promoBadge: promoBadge || null,
        perks: perks.filter((p) => p.text.trim() !== ""),
        details: details.filter((d) => d.trim() !== ""),
        buyUrl: buyUrl || "",
        status,
        displayOrder,
      };

      const url = isEditing ? `/api/promotions/${promotion.id}` : "/api/promotions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save promotion");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Image Upload */}
      <div className="bg-gray-800/30 p-5 rounded-2xl border border-gray-800">
        <label className="block text-sm font-medium text-gray-300 mb-3">รูปภาพสินค้า / รูปโลโก้ (URL หรือ อัปโหลด)</label>
        
        <div className="mb-4">
          <input
            type="text"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            value={!imageFile && imagePreview && !imagePreview.includes("blob:") ? imagePreview : ""}
            onChange={(e) => {
              const url = e.target.value;
              setImageFile(null);
              setImagePreview(url);
            }}
            placeholder="https://... หรือคลิกอัปโหลดด้านล่าง"
          />
        </div>

        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800 w-32 h-32 flex items-center justify-center group">
            <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="128px" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={removeImage}
                className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-[10px] text-gray-300 text-center truncate">
              {imageFile ? imageFile.name : (imagePreview.includes("blob:") ? "Preview" : "URL/Existing")}
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-32 border-2 border-dashed border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl flex flex-col items-center justify-center cursor-pointer text-gray-400 transition-all font-medium"
          >
            <svg className="w-6 h-6 mb-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            <span className="text-[10px]">Add File</span>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type & Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">ประเภทโปรโมชัน <span className="text-red-400">*</span></label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={lockType}
            className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              lockType
                ? "bg-gray-800/30 border-gray-700/60 text-gray-400 cursor-not-allowed"
                : "bg-gray-800/50 border-gray-700 text-white"
            }`}
          >
            <option value="broadband">เน็ตบ้าน (Broadband)</option>
            <option value="monthly">รายเดือน (Monthly)</option>
            <option value="topup">เติมเงิน (Topup)</option>
            <option value="solar">โซล่าเซลล์ (wEnergy)</option>
          </select>
          {lockType && (
            <p className="mt-1 text-[11px] text-gray-500">หน้า dashboard นี้ล็อกประเภทแพ็กเกจไว้เพื่อป้องกันการบันทึกผิดหมวด</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">หมวดหมู่ (Category Name)</label>
          <input
            type="text"
            list={categoryListId}
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. เน็ตเพิ่มสปีด, L Pack"
          />
          {categoryOptions.length > 0 && (
            <>
              <datalist id={categoryListId}>
                {categoryOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
              <div className="mt-2 flex flex-wrap gap-2">
                {categoryOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCategoryName(option)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      categoryName === option
                        ? "border-blue-400/60 bg-blue-500/15 text-blue-300"
                        : "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Name & Badge */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">ชื่อโปรโมชัน <span className="text-red-400">*</span></label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. เน็ตเพิ่มสปีด 60GB 399บาท นาน 30วัน"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">ป้ายกำกับ (Badge)</label>
          <input
            type="text"
            list="promotion-badge-options"
            value={promoBadge}
            onChange={(e) => setPromoBadge(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. แนะนำ🔥"
          />
          <datalist id="promotion-badge-options">
            {BADGE_OPTIONS.map((badge) => (
              <option key={badge} value={badge} />
            ))}
          </datalist>
        </div>

        {/* Buy URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Buy / Apply URL (ลิงก์สมัครบริการเจาะจง)</label>
          <input
            type="url"
            list="promotion-buyurl-options"
            value={buyUrl}
            onChange={(e) => setBuyUrl(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. https://lin.ee/xxxxxx (ปล่อยว่างไว้เพื่อใช้ค่าเริ่มต้นเว็บ)"
          />
          <datalist id="promotion-buyurl-options">
            {BUY_URL_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>

        {/* Price & Price Note */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">ราคา <span className="text-red-400">*</span></label>
          <input
            type="number"
            step="1"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="399"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">หมายเหตุราคา</label>
          <input
            type="text"
            value={priceNote}
            onChange={(e) => setPriceNote(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. (ไม่รวม VAT), /เดือน"
          />
        </div>

        {/* Speed & Validity */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">ข้อมูลหลัก / ความเร็ว</label>
          <input
            type="text"
            list={speedListId}
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 500/500 Mbps, 60 GB"
          />
          <datalist id={speedListId}>
            {speedOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">ระยะเวลา (Validity / Contract)</label>
          <input
            type="text"
            list="promotion-validity-options"
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 30 วัน, 24 เดือน"
          />
          <datalist id="promotion-validity-options">
            {VALIDITY_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Perks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-300">สิทธิพิเศษ / Perks</label>
            <button
              type="button"
              onClick={handleAddPerk}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Perk
            </button>
          </div>
          <div className="space-y-2">
            {perks.map((p, i) => (
              <div key={`perk-${i}`} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={p.text}
                    onChange={(e) => handlePerkChange(i, "text", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. โทรฟรี 200 นาที"
                  />
                  <input
                    type="text"
                    value={p.imageUrl || ""}
                    onChange={(e) => handlePerkChange(i, "imageUrl", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Icon name (e.g. wifi, speed, phone) or URL"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePerk(i)}
                  className="p-2 mt-1 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Details (JSON Array) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-300">รายละเอียดเพิ่มเติม / Freebies</label>
            <button
              type="button"
              onClick={handleAddDetail}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Detail
            </button>
          </div>
          <div className="space-y-2">
            {details.map((d, i) => (
              <div key={`detail-${i}`} className="flex gap-2">
                <input
                  type="text"
                  value={d}
                  onChange={(e) => handleDetailChange(i, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. รับฟรี อุปกรณ์พิเศษ"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDetail(i)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">ลำดับการแสดงผล (Display Order)</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">สถานะ</label>
          <button
            type="button"
            onClick={() => setStatus(!status)}
            className={`w-full px-3 py-2 rounded-xl text-sm transition-colors border ${
              status ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-gray-800/50 border-gray-700 text-gray-400"
            }`}
          >
            {status ? "✓ Active (แสดง)" : "○ Inactive (ซ่อน)"}
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 shadow-lg"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </div>
    </form>
  );
}
