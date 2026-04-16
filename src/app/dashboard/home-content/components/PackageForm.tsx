"use client";

import { useMemo, useState, useRef } from "react";
import Image from "next/image";
import { uploadBannerImage } from "@/src/lib/storage";
import { lineSupport } from "@/src/context/line-path";

interface Package {
  id: string;
  code: string;
  name: string;
  imageUrl: string | null;
  freebie: any | null; // Changed to any for JSON
  speed: string;
  price: number;
  details: any | null; // Changed to any for JSON
  type: string | null;
  buyUrl?: string | null;
  status: boolean;
  displayOrder: number;
}

interface PackageFormProps {
  pkg?: Package | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FreebieItemForm {
  label: string;
  imageUrl: string;
  imageFile: File | null;
}

const TYPE_OPTIONS = ["โปรเน็ตบ้าน", "เน็ตซิมรายวัน", "เน็ตซิมรายเดือน", "ไวไฟฮอตสปอต"];
const SPEED_SUGGESTIONS: Record<string, string[]> = {
  "โปรเน็ตบ้าน": ["300/300 Mbps", "500/500 Mbps", "1000/1000 Mbps"],
  "เน็ตซิมรายวัน": ["5GB", "10GB", "20GB"],
  "เน็ตซิมรายเดือน": ["20GB", "30GB", "60GB", "ไม่จำกัด"],
  "ไวไฟฮอตสปอต": ["10Mbps", "20Mbps", "100Mbps"],
  default: ["500/500 Mbps", "60GB", "ไม่จำกัด"],
};
const BUY_URL_SUGGESTIONS = [lineSupport, "/service", "/boardband", "/topup", "/monthly", "/wEnergy"];

function parseInitialFreebies(freebie: unknown): FreebieItemForm[] {
  if (Array.isArray(freebie)) {
    const items = freebie
      .map<FreebieItemForm | null>((item) => {
        if (typeof item === "string") {
          const label = item.trim();
          return label ? { label, imageUrl: "", imageFile: null } : null;
        }

        if (item && typeof item === "object" && !Array.isArray(item)) {
          const data = item as Record<string, unknown>;
          const labelRaw = data.label ?? data.text ?? data.name;
          const imageRaw = data.imageUrl ?? data.image;

          const label = typeof labelRaw === "string" ? labelRaw.trim() : "";
          const imageUrl = typeof imageRaw === "string" ? imageRaw : "";

          if (!label) return null;
          return { label, imageUrl, imageFile: null };
        }

        return null;
      })
      .filter((item): item is FreebieItemForm => item !== null);

    return items.length > 0 ? items : [{ label: "", imageUrl: "", imageFile: null }];
  }

  if (typeof freebie === "string" && freebie.trim()) {
    const items = freebie
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((label) => ({ label, imageUrl: "", imageFile: null }));

    return items.length > 0 ? items : [{ label: "", imageUrl: "", imageFile: null }];
  }

  return [{ label: "", imageUrl: "", imageFile: null }];
}

export default function PackageForm({ pkg, onSuccess, onCancel }: PackageFormProps) {
  const isEditing = !!pkg;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const freebieFileRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [code, setCode] = useState(pkg?.code || "");
  const [name, setName] = useState(pkg?.name || "");
  const [speed, setSpeed] = useState(pkg?.speed || "");
  const [price, setPrice] = useState(pkg?.price?.toString() || "");
  const [type, setType] = useState(pkg?.type || "โปรเน็ตบ้าน");
  const [buyUrl, setBuyUrl] = useState(pkg?.buyUrl || "");
  const [status, setStatus] = useState(pkg?.status ?? true);
  const [displayOrder, setDisplayOrder] = useState(pkg?.displayOrder || 0);

  // Array states for JSON fields
  const [details, setDetails] = useState<string[]>(() => {
    if (Array.isArray(pkg?.details)) return pkg.details;
    if (typeof pkg?.details === "string" && pkg.details) return [pkg.details];
    return [""];
  });

  const [freebies, setFreebies] = useState<FreebieItemForm[]>(() => parseInitialFreebies(pkg?.freebie));

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(pkg?.imageUrl || null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCustomType = Boolean(type) && !TYPE_OPTIONS.includes(type);
  const speedOptions = useMemo(() => SPEED_SUGGESTIONS[type] || SPEED_SUGGESTIONS.default, [type]);
  const speedListId = `package-speed-options-${(type || "default").replace(/\s+/g, "-")}`;

  const handleAddField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, ""]);
  };

  const handleRemoveField = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddFreebie = () => {
    setFreebies((prev) => [...prev, { label: "", imageUrl: "", imageFile: null }]);
  };

  const handleRemoveFreebie = (index: number) => {
    setFreebies((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFreebieChange = (index: number, field: "label" | "imageUrl", value: string) => {
    setFreebies((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === "imageUrl") {
        item.imageFile = null;
      }
      next[index] = item;
      return next;
    });
  };

  const handleFreebieFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image for freebie");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFreebies((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], imageFile: file, imageUrl: previewUrl };
      return next;
    });
    setError(null);
  };

  const clearFreebieImage = (index: number) => {
    setFreebies((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], imageFile: null, imageUrl: "" };
      return next;
    });
    if (freebieFileRefs.current[index]) {
      freebieFileRefs.current[index]!.value = "";
    }
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
      let finalImageUrl = pkg?.imageUrl || "";

      if (imageFile) {
        finalImageUrl = await uploadBannerImage(imageFile);
      }

      const finalFreebies = await Promise.all(
        freebies.map(async (item) => {
          const label = item.label.trim();
          if (!label) return null;

          let finalFreebieImageUrl = item.imageUrl;
          if (item.imageFile) {
            finalFreebieImageUrl = await uploadBannerImage(item.imageFile);
          }

          if (finalFreebieImageUrl?.includes("blob:")) {
            finalFreebieImageUrl = "";
          }

          return {
            label,
            imageUrl: finalFreebieImageUrl || null,
          };
        })
      );

      const body = {
        code,
        name,
        imageUrl: imageFile ? finalImageUrl : (imagePreview ? (imagePreview.includes("blob:") ? finalImageUrl : imagePreview) : ""),
        freebie: finalFreebies.filter((item): item is { label: string; imageUrl: string | null } => item !== null),
        speed,
        price: parseFloat(price) || 0,
        details: details.filter((d) => d.trim() !== ""),
        type: type || null,
        buyUrl: buyUrl || "",
        status,
        displayOrder,
      };

      const url = isEditing ? `/api/packages/${pkg.id}` : "/api/packages";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save package");
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
        <label className="block text-sm font-medium text-gray-300 mb-3">Package Image (URL or Upload)</label>
        
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
            placeholder="https://... or click upload below"
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
        {/* Code & Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Item Code <span className="text-red-400">*</span></label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="#12345"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Category (Type) <span className="text-red-400">*</span></label>
          <select
            value={isCustomType ? "__custom__" : type}
            onChange={(e) => {
              const next = e.target.value;
              if (next === "__custom__") {
                setType("");
                return;
              }
              setType(next);
            }}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value="__custom__">อื่นๆ (กำหนดเอง)</option>
          </select>
          {isCustomType && (
            <input
              type="text"
              list="package-type-options"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="ระบุประเภทเพิ่มเติม"
            />
          )}
          <datalist id="package-type-options">
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>

        {/* Buy URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Buy / Apply URL (ลิงก์สมัครบริการ)</label>
          <input
            type="url"
            list="package-buyurl-options"
            value={buyUrl}
            onChange={(e) => setBuyUrl(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. https://lin.ee/xxxxxx (ปล่อยว่างไว้เพื่อใช้ค่าเริ่มต้นเว็บ)"
          />
          <datalist id="package-buyurl-options">
            {BUY_URL_SUGGESTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>

        {/* Name & Speed */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Name (โปร) <span className="text-red-400">*</span></label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. โปรเน็ตบ้าน"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Speed <span className="text-red-400">*</span></label>
          <input
            type="text"
            list={speedListId}
            required
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 10Gbps"
          />
          <datalist id={speedListId}>
            {speedOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Price <span className="text-red-400">*</span></label>
          <input
            type="number"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="4.95"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Details Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-300">Details (รายละเอียด)</label>
            <button
              type="button"
              onClick={() => handleAddField(setDetails)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            {details.map((d, i) => (
              <div key={`detail-${i}`} className="flex gap-2">
                <input
                  type="text"
                  value={d}
                  onChange={(e) => handleFieldChange(i, e.target.value, setDetails)}
                  className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. ความเร็วสูงสุด 1000Mbps"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveField(i, setDetails)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Freebies Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-300">Freebies (ของแถม)</label>
            <button
              type="button"
              onClick={handleAddFreebie}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            {freebies.map((item, i) => (
              <div key={`freebie-${i}`} className="space-y-2 rounded-xl border border-gray-700 bg-gray-900/40 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleFreebieChange(i, "label", e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. ฟรีค่าติดตั้ง"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFreebie(i)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={!item.imageFile && item.imageUrl && !item.imageUrl.includes("blob:") ? item.imageUrl : ""}
                    onChange={(e) => handleFreebieChange(i, "imageUrl", e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Image URL ของของแถม (optional)"
                  />
                  <button
                    type="button"
                    onClick={() => freebieFileRefs.current[i]?.click()}
                    className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium transition-colors"
                  >
                    Upload
                  </button>
                </div>

                {item.imageUrl && (
                  <div className="flex items-center gap-2">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
                      <img src={item.imageUrl} alt={item.label || "freebie"} className="h-full w-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => clearFreebieImage(i)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove image
                    </button>
                  </div>
                )}

                <input
                  ref={(el) => {
                    freebieFileRefs.current[i] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFreebieFileSelect(i, e)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
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
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50 shadow-lg"
        >
          {saving ? "Saving..." : "Save Package"}
        </button>
      </div>
    </form>
  );
}
