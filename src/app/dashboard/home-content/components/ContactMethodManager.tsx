"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { lineSupport } from "@/src/context/line-path";
import { uploadBannerImage } from "@/src/lib/storage";

interface ContactMethod {
  id: string;
  key: string;
  title: string;
  description: string | null;
  iconUrl: string | null;
  href: string;
  colorClass: string | null;
  displayOrder: number;
  isActive: boolean;
}

interface Props {
  initialItems: ContactMethod[];
}

interface ContactTemplate {
  key: string;
  title: string;
  description: string;
  href: string;
  colorClass: string | null;
  displayOrder: number;
}

const DEFAULT_CONTACT_TEMPLATES: ContactTemplate[] = [
  {
    key: "line",
    title: "สมัครทางไลน์",
    description: "สะดวกรวดเร็วแอดมินตอบทันที",
    href: lineSupport,
    colorClass: "#00B900",
    displayOrder: 0,
  },
  {
    key: "phone",
    title: "โทรสมัคร",
    description: "ติดต่อเจ้าหน้าที่ได้ทันที",
    href: "tel:021234567",
    colorClass: null,
    displayOrder: 1,
  },
  {
    key: "facebook",
    title: "ติดต่อทาง Facebook",
    description: "สะดวกรวดเร็ว ข้อมูลครบ",
    href: "https://www.facebook.com/profile.php?id=61558200500505",
    colorClass: "#1877F2",
    displayOrder: 2,
  },
];

const CONTACT_HREF_OPTIONS = [lineSupport, "tel:021234567", "https://www.facebook.com/profile.php?id=61558200500505", "/service"];

export default function ContactMethodManager({ initialItems }: Props) {
  const [items, setItems] = useState<ContactMethod[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seedingDefaults, setSeedingDefaults] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    key: "line",
    title: "",
    description: "",
    iconUrl: "",
    href: "",
    colorClass: "",
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const keyOptions = useMemo(() => {
    const defaults = ["line", "phone", "facebook"];
    const dynamic = Array.from(new Set(items.map((item) => item.key)));
    return Array.from(new Set([...defaults, ...dynamic])).filter(Boolean);
  }, [items]);

  const presetKeys = useMemo(() => DEFAULT_CONTACT_TEMPLATES.map((template) => template.key), []);

  const resetForm = () => {
    setForm({
      key: keyOptions[0] ?? "line",
      title: "",
      description: "",
      iconUrl: "",
      href: "",
      colorClass: "",
      displayOrder: items.length,
      isActive: true,
    });
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: ContactMethod) => {
    setForm({
      key: item.key,
      title: item.title,
      description: item.description ?? "",
      iconUrl: item.iconUrl ?? "",
      href: item.href,
      colorClass: item.colorClass ?? "",
      displayOrder: item.displayOrder,
      isActive: item.isActive,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const startAdd = () => {
    resetForm();
    setForm((prev) => ({ ...prev, displayOrder: items.length, key: keyOptions[0] ?? "line" }));
    setShowForm(true);
  };

  const applyPreset = (nextKey: string) => {
    const preset = DEFAULT_CONTACT_TEMPLATES.find((template) => template.key === nextKey);
    if (!preset) {
      setForm((prev) => ({ ...prev, key: nextKey }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      key: preset.key,
      title: preset.title,
      description: preset.description,
      href: preset.href,
      colorClass: preset.colorClass || "",
    }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    setUploadingImage(true);
    setMessage("");

    try {
      const uploadedUrl = await uploadBannerImage(file);
      setForm((prev) => ({ ...prev, iconUrl: uploadedUrl }));
      setMessage("อัปโหลดรูปสำเร็จ");
    } catch (error) {
      console.error(error);
      setMessage("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSeedDefaultItems = async () => {
    setSeedingDefaults(true);
    setMessage("");

    try {
      const missingTemplates = DEFAULT_CONTACT_TEMPLATES.filter(
        (template) => !items.some((item) => item.key === template.key)
      );

      if (missingTemplates.length === 0) {
        setMessage("มีช่องทางติดต่อเริ่มต้นครบแล้ว ตอนนี้แก้รูป/ข้อความได้เลย");
        return;
      }

      for (const template of missingTemplates) {
        const res = await fetch("/api/contact-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: template.key,
            title: template.title,
            description: template.description,
            href: template.href,
            iconUrl: null,
            colorClass: template.colorClass,
            displayOrder: template.displayOrder,
            isActive: true,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to seed contact method");
        }
      }

      const refreshRes = await fetch("/api/contact-methods", { method: "GET" });
      if (!refreshRes.ok) {
        throw new Error("Failed to refresh contact methods");
      }

      const latestItems: ContactMethod[] = await refreshRes.json();
      setItems(latestItems);
      setMessage("โหลดช่องทางติดต่อเริ่มต้นสำเร็จ! ตอนนี้แก้รูปและลิงก์ได้ทันที");
    } catch (error) {
      console.error(error);
      setMessage("เกิดข้อผิดพลาดในการโหลดค่าเริ่มต้น");
    } finally {
      setSeedingDefaults(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        ...form,
        description: form.description || null,
        iconUrl: form.iconUrl || null,
        colorClass: form.colorClass || null,
      };

      if (editingId) {
        const res = await fetch(`/api/contact-methods/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        const updated = await res.json();
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const res = await fetch("/api/contact-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        const created = await res.json();
        setItems((prev) => [...prev, created]);
      }

      resetForm();
      setMessage("บันทึกสำเร็จ!");
    } catch {
      setMessage("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบช่องทางติดต่อนี้?")) return;

    try {
      const res = await fetch(`/api/contact-methods/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setItems((prev) => prev.filter((item) => item.id !== id));
      setMessage("ลบสำเร็จ!");
    } catch {
      setMessage("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const inputClass =
    "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";
  const isCustomKey = !presetKeys.includes(form.key);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{item.title}</p>
              <p className="text-gray-500 text-xs truncate">{item.href}</p>
              <p className="text-gray-500 text-xs mt-1">
                key: <span className="text-gray-300">{item.key}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-700 bg-gray-900 shrink-0">
              {item.iconUrl ? (
                <img src={item.iconUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">No Image</div>
              )}
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                item.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-600/20 text-gray-500"
              }`}
            >
              {item.isActive ? "แสดง" : "ซ่อน"}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => startEdit(item)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/30 p-6 text-center space-y-3">
            <p className="text-gray-400 text-sm">ยังไม่มีช่องทางติดต่อในฐานข้อมูล</p>
            <p className="text-gray-500 text-xs">หน้าเว็บจะใช้ค่า fallback จนกว่าจะเพิ่มข้อมูลจริงในส่วนนี้</p>
            <button
              onClick={handleSeedDefaultItems}
              disabled={seedingDefaults}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {seedingDefaults ? "กำลังโหลดค่าเริ่มต้น..." : "โหลดช่องทางติดต่อค่าเริ่มต้น"}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="p-5 bg-gray-900/80 border border-gray-700 rounded-xl space-y-4">
          <h4 className="text-sm font-semibold text-white">{editingId ? "แก้ไขช่องทางติดต่อ" : "เพิ่มช่องทางติดต่อใหม่"}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Key</label>
              <select
                className={inputClass}
                value={isCustomKey ? "__custom__" : form.key}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === "__custom__") {
                    setForm((prev) => ({ ...prev, key: presetKeys.includes(prev.key) ? "" : prev.key }));
                    return;
                  }
                  applyPreset(next);
                }}
              >
                {presetKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
                <option value="__custom__">อื่นๆ (กำหนดเอง)</option>
              </select>
              {isCustomKey && (
                <input
                  className={`${inputClass} mt-2`}
                  list="contact-key-options"
                  value={form.key}
                  onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
                  placeholder="custom-key"
                />
              )}
              <datalist id="contact-key-options">
                {keyOptions.map((key) => (
                  <option key={key} value={key} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelClass}>หัวข้อ</label>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="สมัครทางไลน์"
              />
            </div>
            <div>
              <label className={labelClass}>ลิงก์ติดต่อ</label>
              <input
                className={inputClass}
                list="contact-href-options"
                value={form.href}
                onChange={(e) => setForm((prev) => ({ ...prev, href: e.target.value }))}
                placeholder="https://lin.ee/..."
              />
              <datalist id="contact-href-options">
                {CONTACT_HREF_OPTIONS.map((href) => (
                  <option key={href} value={href} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelClass}>ลำดับการแสดง</label>
              <input
                className={inputClass}
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>คำอธิบาย</label>
              <input
                className={inputClass}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="สะดวกรวดเร็วแอดมินตอบทันที"
              />
            </div>
            <div>
              <label className={labelClass}>Icon URL (optional)</label>
              <input
                className={inputClass}
                value={form.iconUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, iconUrl: e.target.value }))}
                placeholder="https://..."
              />

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  {uploadingImage ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, iconUrl: "" }));
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  }}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors"
                >
                  ล้างรูป
                </button>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {form.iconUrl && (
                <div className="mt-3 w-full max-w-[180px] rounded-xl overflow-hidden border border-gray-700 bg-gray-800/60 p-2">
                  <img src={form.iconUrl} alt="Contact preview" className="w-full h-20 object-cover rounded-lg" />
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>Color (optional, e.g. #00B900)</label>
              <input
                className={inputClass}
                value={form.colorClass}
                onChange={(e) => setForm((prev) => ({ ...prev, colorClass: e.target.value }))}
                placeholder="#00B900"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
            />
            <span className="text-sm text-gray-300">แสดงผลผ่านหน้าเว็บ</span>
          </label>

          <div className="flex gap-2 pt-2 border-t border-gray-800 mt-4">
            <button
              onClick={handleSave}
              disabled={saving || uploadingImage}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {uploadingImage ? "รออัปโหลดรูป..." : saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {!showForm && (
          <>
            <button
              onClick={startAdd}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              เพิ่มช่องทางติดต่อ
            </button>

            <button
              onClick={handleSeedDefaultItems}
              disabled={seedingDefaults}
              className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {seedingDefaults ? "กำลังโหลด..." : "ใช้ค่าเริ่มต้นอัตโนมัติ"}
            </button>
          </>
        )}
        {message && (
          <span className={`text-sm ${message.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
