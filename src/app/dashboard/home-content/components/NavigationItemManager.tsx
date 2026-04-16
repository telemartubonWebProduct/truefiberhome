"use client";

import { useEffect, useRef, useState } from "react";
import { uploadBannerImage } from "@/src/lib/storage";

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  parentKey: string | null;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

interface Props {
  initialItems: NavigationItem[];
}

interface NavigationTemplate {
  label: string;
  path: string;
  parentKey: string;
  displayOrder: number;
}

const PARENT_KEY_OPTIONS = [
  { value: "mega.broadband", label: "แพ็กเกจเน็ตบ้าน" },
  { value: "mega.mobile", label: "แพ็กเกจมือถือ" },
  { value: "mega.energy", label: "โซล่าเซลล์" },
  { value: "mega.service", label: "บริการและสอบถาม" },
];

const NAV_PATH_OPTIONS = ["/boardband", "/topup", "/monthly", "/wEnergy", "/service", "/home", "/termsAndPrivacy"];

const DEFAULT_NAV_TEMPLATES: NavigationTemplate[] = [
  { label: "แพ็กเกจเน็ตบ้านทรู", path: "/boardband", parentKey: "mega.broadband", displayOrder: 0 },
  { label: "บริการติดตั้งและย้ายจุด", path: "/service", parentKey: "mega.broadband", displayOrder: 1 },
  { label: "เติมเงิน", path: "/topup", parentKey: "mega.mobile", displayOrder: 2 },
  { label: "รายเดือน", path: "/monthly", parentKey: "mega.mobile", displayOrder: 3 },
  { label: "โซล่าเซลล์ W&W Energy", path: "/wEnergy", parentKey: "mega.energy", displayOrder: 4 },
  { label: "บริการและสอบถามทั้งหมด", path: "/service", parentKey: "mega.service", displayOrder: 5 },
];

export default function NavigationItemManager({ initialItems }: Props) {
  const [items, setItems] = useState<NavigationItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seedingDefaults, setSeedingDefaults] = useState(false);
  const [allowAdvancedEdit, setAllowAdvancedEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    label: "",
    path: "",
    parentKey: "",
    iconUrl: "",
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const resetForm = () => {
    setForm({
      label: "",
      path: "",
      parentKey: "",
      iconUrl: "",
      displayOrder: items.length,
      isActive: true,
    });
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setAllowAdvancedEdit(false);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: NavigationItem) => {
    setForm({
      label: item.label,
      path: item.path,
      parentKey: item.parentKey ?? "",
      iconUrl: item.iconUrl ?? "",
      displayOrder: item.displayOrder,
      isActive: item.isActive,
    });
    setAllowAdvancedEdit(false);
    setEditingId(item.id);
    setShowForm(true);
  };

  const startAdd = () => {
    resetForm();
    setForm((prev) => ({ ...prev, displayOrder: items.length }));
    setShowForm(true);
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
      const missingTemplates = DEFAULT_NAV_TEMPLATES.filter(
        (template) =>
          !items.some(
            (item) => item.label === template.label && item.path === template.path && (item.parentKey || "") === template.parentKey
          )
      );

      if (missingTemplates.length === 0) {
        setMessage("มีเมนูพาธเดิมครบแล้ว ตอนนี้แก้เฉพาะรูปได้เลย");
        return;
      }

      for (const template of missingTemplates) {
        const res = await fetch("/api/navigation-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: template.label,
            path: template.path,
            parentKey: template.parentKey,
            iconUrl: null,
            displayOrder: template.displayOrder,
            isActive: true,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to seed navigation item");
        }
      }

      const refreshRes = await fetch("/api/navigation-items", { method: "GET" });
      if (!refreshRes.ok) {
        throw new Error("Failed to refresh navigation items");
      }

      const latestItems: NavigationItem[] = await refreshRes.json();
      setItems(latestItems);
      setMessage("โหลดเมนูพาธเดิมสำเร็จ! ตอนนี้แก้เฉพาะรูปได้ทันที");
    } catch (error) {
      console.error(error);
      setMessage("เกิดข้อผิดพลาดในการโหลดพาธเดิม");
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
        parentKey: form.parentKey || null,
        iconUrl: form.iconUrl || null,
      };

      if (editingId) {
        const res = await fetch(`/api/navigation-items/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        const updated = await res.json();
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const res = await fetch("/api/navigation-items", {
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
    if (!confirm("ต้องการลบรายการนี้?")) return;

    try {
      const res = await fetch(`/api/navigation-items/${id}`, { method: "DELETE" });
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
  const isCustomParentKey = Boolean(form.parentKey) && !PARENT_KEY_OPTIONS.some((option) => option.value === form.parentKey);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-700 bg-gray-900 shrink-0">
              {item.iconUrl ? (
                <img src={item.iconUrl} alt={item.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">No Image</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{item.label}</p>
              <p className="text-gray-500 text-xs truncate">{item.path}</p>
              <p className="text-gray-500 text-xs mt-1">
                parentKey: <span className="text-gray-300">{item.parentKey || "(top-level)"}</span>
              </p>
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
            <p className="text-gray-400 text-sm">ยังไม่มีเมนูนำทางในฐานข้อมูล</p>
            <button
              onClick={handleSeedDefaultItems}
              disabled={seedingDefaults}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {seedingDefaults ? "กำลังโหลดพาธเดิม..." : "โหลดเมนูพาธเดิม (แก้เฉพาะรูป)"}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="p-5 bg-gray-900/80 border border-gray-700 rounded-xl space-y-4">
          <h4 className="text-sm font-semibold text-white">{editingId ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}</h4>

          {editingId && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
              โหมดแก้ไขรูปอย่างเดียว: Path เดิมถูกล็อกไว้
              <button
                type="button"
                onClick={() => setAllowAdvancedEdit((prev) => !prev)}
                className="ml-3 underline underline-offset-2 text-blue-300 hover:text-blue-200"
              >
                {allowAdvancedEdit ? "ล็อกกลับ" : "ปลดล็อกแก้ข้อมูลอื่น"}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>ชื่อเมนู</label>
              <input
                className={inputClass}
                value={form.label}
                disabled={Boolean(editingId) && !allowAdvancedEdit}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="สินค้า"
              />
            </div>
            <div>
              <label className={labelClass}>ลิงก์</label>
              <input
                className={inputClass}
                list="nav-path-options"
                value={form.path}
                disabled={Boolean(editingId) && !allowAdvancedEdit}
                onChange={(e) => setForm((prev) => ({ ...prev, path: e.target.value }))}
                placeholder="/home"
              />
              <datalist id="nav-path-options">
                {NAV_PATH_OPTIONS.map((path) => (
                  <option key={path} value={path} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelClass}>Parent Key (ถ้าเป็นเมนูย่อย)</label>
              <select
                className={inputClass}
                value={isCustomParentKey ? "__custom__" : form.parentKey}
                disabled={Boolean(editingId) && !allowAdvancedEdit}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === "__custom__") {
                    setForm((prev) => ({
                      ...prev,
                      parentKey: PARENT_KEY_OPTIONS.some((option) => option.value === prev.parentKey) ? "" : prev.parentKey,
                    }));
                    return;
                  }
                  setForm((prev) => ({ ...prev, parentKey: next }));
                }}
              >
                <option value="">(top-level)</option>
                {PARENT_KEY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="__custom__">อื่นๆ (กำหนดเอง)</option>
              </select>
              {isCustomParentKey && (
                <input
                  list="nav-parentkey-options"
                  className={`${inputClass} mt-2`}
                  value={form.parentKey}
                  disabled={Boolean(editingId) && !allowAdvancedEdit}
                  onChange={(e) => setForm((prev) => ({ ...prev, parentKey: e.target.value }))}
                  placeholder="mega.custom"
                />
              )}
              <datalist id="nav-parentkey-options">
                {PARENT_KEY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </datalist>
              <p className="text-[11px] text-gray-500 mt-1">
                ค่าแนะนำ: {PARENT_KEY_OPTIONS.map((option) => option.value).join(", ")}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Hover Image URL (รูปฝั่งขวาเวลา hover เมนู)</label>
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
                <div className="mt-3 w-full max-w-xs rounded-xl overflow-hidden border border-gray-700 bg-gray-800/60 p-2">
                  <img src={form.iconUrl} alt="Hover preview" className="w-full h-28 object-cover rounded-lg" />
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>ลำดับการแสดง</label>
              <input
                className={inputClass}
                type="number"
                value={form.displayOrder}
                disabled={Boolean(editingId) && !allowAdvancedEdit}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))
                }
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
              เพิ่มเมนูนำทาง
            </button>

            <button
              onClick={handleSeedDefaultItems}
              disabled={seedingDefaults}
              className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {seedingDefaults ? "กำลังโหลด..." : "ใช้พาธเดิมอัตโนมัติ"}
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
