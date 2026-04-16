"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { uploadBannerImage } from "@/src/lib/storage";

interface MenuCategoryItem {
  id: string;
  iconUrl: string;
  alt: string;
  text: string;
  path: string;
  displayOrder: number;
  isActive: boolean;
}

interface Props {
  initialItems: MenuCategoryItem[];
}

const MENU_PATH_OPTIONS = ["/boardband", "/topup", "/monthly", "/wEnergy", "/service", "/home"];

const MENU_TEXT_OPTIONS = [
  "แพ็กเกจเน็ตบ้าน",
  "แพ็กเกจเติมเงิน",
  "แพ็กเกจรายเดือน",
  "โซล่าเซลล์",
  "บริการและสอบถาม",
];

const TEXT_PATH_MAP: Record<string, string> = {
  "แพ็กเกจเน็ตบ้าน": "/boardband",
  "แพ็กเกจเติมเงิน": "/topup",
  "แพ็กเกจรายเดือน": "/monthly",
  "โซล่าเซลล์": "/wEnergy",
  "บริการและสอบถาม": "/service",
};

export default function MenuCategoryManager({ initialItems }: Props) {
  const [items, setItems] = useState<MenuCategoryItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Form state
  const [form, setForm] = useState({
    iconUrl: "",
    alt: "",
    text: MENU_TEXT_OPTIONS[0],
    path: TEXT_PATH_MAP[MENU_TEXT_OPTIONS[0]],
    displayOrder: 0,
    isActive: true,
  });

  // Sync state when props change (after router.refresh())
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const textSuggestions = useMemo(() => {
    const dynamic = items.map((item) => item.text).filter(Boolean);
    return Array.from(new Set([...MENU_TEXT_OPTIONS, ...dynamic]));
  }, [items]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const resetForm = () => {
    setForm({
      iconUrl: "",
      alt: "",
      text: MENU_TEXT_OPTIONS[0],
      path: TEXT_PATH_MAP[MENU_TEXT_OPTIONS[0]],
      displayOrder: items.length,
      isActive: true,
    });
    setEditingId(null);
    setImageFile(null);
    setShowForm(false);
  };

  const startEdit = (item: MenuCategoryItem) => {
    setForm({ iconUrl: item.iconUrl, alt: item.alt, text: item.text, path: item.path, displayOrder: item.displayOrder, isActive: item.isActive });
    setEditingId(item.id);
    setImageFile(null);
    setShowForm(true);
  };

  const startAdd = () => {
    resetForm();
    setForm((f) => ({ ...f, displayOrder: items.length }));
    setShowForm(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setForm({ ...form, iconUrl: previewUrl });
  };

  const removeImage = () => {
    setImageFile(null);
    setForm({ ...form, iconUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      let finalIconUrl = form.iconUrl;
      if (imageFile) {
        finalIconUrl = await uploadBannerImage(imageFile);
      } else if (form.iconUrl && !form.iconUrl.includes("blob:")) {
        finalIconUrl = form.iconUrl;
      } else if (form.iconUrl?.includes("blob:")) {
        finalIconUrl = "";
      }

      const payload = { ...form, iconUrl: finalIconUrl };

      if (editingId) {
        const res = await fetch(`/api/menu-categories/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        const updated = await res.json();
        setItems(items.map((i) => (i.id === editingId ? updated : i)));
      } else {
        const res = await fetch("/api/menu-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        const created = await res.json();
        setItems([...items, created]);
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
    if (!confirm("ต้องการลบรายการนี้?")) return;
    try {
      const res = await fetch(`/api/menu-categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setItems(items.filter((i) => i.id !== id));
      setMessage("ลบสำเร็จ!");
    } catch {
      setMessage("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const inputClass = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";
  const isCustomPath = !MENU_PATH_OPTIONS.includes(form.path);

  return (
    <div className="space-y-4">
      {/* Item List */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {item.iconUrl ? <img src={item.iconUrl} alt={item.alt} className="w-8 h-8 object-contain" /> : <span className="text-gray-500 text-xs">N/A</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{item.text}</p>
              <p className="text-gray-500 text-xs truncate">{item.path}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-600/20 text-gray-500"}`}>
              {item.isActive ? "แสดง" : "ซ่อน"}
            </span>
            <div className="flex gap-1">
              <button onClick={() => startEdit(item)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" title="Edit">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm text-center py-8">ยังไม่มีหมวดหมู่เมนู — กดปุ่มด้านล่างเพื่อเพิ่ม</p>}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="p-5 bg-gray-900/80 border border-gray-700 rounded-xl space-y-4">
          <h4 className="text-sm font-semibold text-white">{editingId ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}</h4>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Image Uploader */}
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <label className={labelClass}>ไอคอนหมวดหมู่ (Icon URL หรือ อัปโหลด)</label>
              <div className="mb-3">
                <input
                  className={inputClass}
                  value={!imageFile && form.iconUrl && !form.iconUrl.includes("blob:") ? form.iconUrl : ""}
                  onChange={(e) => {
                    const url = e.target.value;
                    setImageFile(null);
                    setForm({ ...form, iconUrl: url });
                  }}
                  placeholder="https://... หรือคลิกอัปโหลดด้านล่าง"
                />
              </div>

              {form.iconUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-800 flex flex-col items-center p-3 h-32">
                  <img src={form.iconUrl} alt="Preview" className="h-full object-contain" />
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

            {/* Other Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
              <div className="md:col-span-2">
                <label className={labelClass}>ข้อความ (Text)</label>
                <input
                  className={inputClass}
                  list="menu-text-options"
                  value={form.text}
                  onChange={(e) => {
                    const nextText = e.target.value;
                    setForm((prev) => {
                      const suggestedPath = TEXT_PATH_MAP[nextText];
                      const shouldAutoPath = !prev.path || Object.values(TEXT_PATH_MAP).includes(prev.path);
                      const nextPath = suggestedPath && shouldAutoPath ? suggestedPath : prev.path;
                      const nextAlt = !prev.alt ? nextText : prev.alt;
                      return { ...prev, text: nextText, path: nextPath, alt: nextAlt };
                    });
                  }}
                  placeholder="แพ็กเกจมือถือ"
                />
                <datalist id="menu-text-options">
                  {textSuggestions.map((text) => (
                    <option key={text} value={text} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <div>
                  <label className={labelClass}>ลิงก์ (Path)</label>
                  <select
                    className={inputClass}
                    value={isCustomPath ? "__custom__" : form.path}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next === "__custom__") {
                        setForm((prev) => ({ ...prev, path: MENU_PATH_OPTIONS.includes(prev.path) ? "" : prev.path }));
                        return;
                      }
                      setForm((prev) => ({ ...prev, path: next }));
                    }}
                  >
                    {MENU_PATH_OPTIONS.map((path) => (
                      <option key={path} value={path}>
                        {path}
                      </option>
                    ))}
                    <option value="__custom__">อื่นๆ (กำหนดเอง)</option>
                  </select>
                </div>

                {isCustomPath && (
                  <input
                    className={inputClass}
                    list="menu-path-options"
                    value={form.path}
                    onChange={(e) => setForm((prev) => ({ ...prev, path: e.target.value }))}
                    placeholder="/topup"
                  />
                )}

                <datalist id="menu-path-options">
                  {MENU_PATH_OPTIONS.map((path) => (
                    <option key={path} value={path} />
                  ))}
                </datalist>
              </div>
              <div><label className={labelClass}>Alt Text</label><input className={inputClass} value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} placeholder="แพ็กเกจมือถือ" /></div>
              <div><label className={labelClass}>ลำดับการแสดง</label><input className={inputClass} type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></div>
            </div>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500" />
            <span className="text-sm text-gray-300">แสดงผลผ่านหน้าเว็บ</span>
          </label>
          <div className="flex gap-2 pt-2 border-t border-gray-800 mt-4 pt-4">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors">ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {!showForm && (
          <button onClick={startAdd} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            เพิ่มเมนู
          </button>
        )}
        {message && <span className={`text-sm ${message.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}>{message}</span>}
      </div>
    </div>
  );
}
