"use client";

import { useEffect, useMemo, useState } from "react";

interface FooterLinkItem {
  id: string;
  section: string;
  label: string;
  path: string;
  external: boolean;
  displayOrder: number;
  isActive: boolean;
}

interface Props {
  initialItems: FooterLinkItem[];
}

interface FooterTemplate {
  section: string;
  label: string;
  path: string;
  external: boolean;
  displayOrder: number;
}

const SECTION_OPTIONS = ["company", "services", "support"];
const FOOTER_PATH_OPTIONS = ["/home", "/service", "/boardband", "/topup", "/monthly", "/wEnergy", "/termsAndPrivacy"];
const LABEL_SUGGESTIONS_BY_SECTION: Record<string, string[]> = {
  company: ["Contact", "About Us", "Our Team"],
  services: ["Internet", "Wifi", "SolarCell", "เติมเงิน", "รายเดือน"],
  support: ["Help Center", "Terms & Privacy", "FAQ"],
};

const DEFAULT_FOOTER_TEMPLATES: FooterTemplate[] = [
  { section: "company", label: "Contact", path: "/service", external: false, displayOrder: 0 },
  { section: "services", label: "Internet", path: "/topup", external: false, displayOrder: 1 },
  { section: "services", label: "Wifi", path: "/boardband", external: false, displayOrder: 2 },
  { section: "services", label: "SolarCell", path: "/wEnergy", external: false, displayOrder: 3 },
  { section: "support", label: "Help Center", path: "/service", external: false, displayOrder: 4 },
  { section: "support", label: "Terms & Privacy", path: "/termsAndPrivacy", external: false, displayOrder: 5 },
];

export default function FooterLinkManager({ initialItems }: Props) {
  const [items, setItems] = useState<FooterLinkItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seedingDefaults, setSeedingDefaults] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    section: "company",
    label: "",
    path: "",
    external: false,
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const sectionOptions = useMemo(() => {
    const dynamicSections = Array.from(new Set(items.map((item) => item.section)));
    return Array.from(new Set([...SECTION_OPTIONS, ...dynamicSections])).filter(Boolean);
  }, [items]);

  const labelSuggestions = useMemo(() => {
    const defaults = LABEL_SUGGESTIONS_BY_SECTION[form.section] ?? [];
    const dynamic = items
      .filter((item) => item.section === form.section)
      .map((item) => item.label)
      .filter(Boolean);
    return Array.from(new Set([...defaults, ...dynamic]));
  }, [form.section, items]);

  const resetForm = () => {
    setForm({
      section: sectionOptions[0] ?? "company",
      label: "",
      path: "",
      external: false,
      displayOrder: items.length,
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: FooterLinkItem) => {
    setForm({
      section: item.section,
      label: item.label,
      path: item.path,
      external: item.external,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const startAdd = () => {
    resetForm();
    setForm((prev) => ({
      ...prev,
      section: sectionOptions[0] ?? "company",
      displayOrder: items.length,
    }));
    setShowForm(true);
  };

  const handleSeedDefaultItems = async () => {
    setSeedingDefaults(true);
    setMessage("");

    try {
      const missingTemplates = DEFAULT_FOOTER_TEMPLATES.filter(
        (template) =>
          !items.some(
            (item) =>
              item.section === template.section &&
              item.label === template.label &&
              item.path === template.path
          )
      );

      if (missingTemplates.length === 0) {
        setMessage("มีลิงก์ Footer เริ่มต้นครบแล้ว");
        return;
      }

      for (const template of missingTemplates) {
        const res = await fetch("/api/footer-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: template.section,
            label: template.label,
            path: template.path,
            external: template.external,
            displayOrder: template.displayOrder,
            isActive: true,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to seed footer link");
        }
      }

      const refreshRes = await fetch("/api/footer-links", { method: "GET" });
      if (!refreshRes.ok) {
        throw new Error("Failed to refresh footer links");
      }

      const latestItems: FooterLinkItem[] = await refreshRes.json();
      setItems(latestItems);
      setMessage("โหลดลิงก์ Footer ค่าเริ่มต้นสำเร็จ!");
    } catch (error) {
      console.error(error);
      setMessage("เกิดข้อผิดพลาดในการโหลดลิงก์ Footer");
    } finally {
      setSeedingDefaults(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      if (editingId) {
        const res = await fetch(`/api/footer-links/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed");
        const updated = await res.json();
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const res = await fetch("/api/footer-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
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
      const res = await fetch(`/api/footer-links/${id}`, { method: "DELETE" });
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
  const isCustomSection = Boolean(form.section) && !SECTION_OPTIONS.includes(form.section);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{item.label}</p>
              <p className="text-gray-500 text-xs truncate">{item.path}</p>
              <p className="text-gray-500 text-xs mt-1">
                section: <span className="text-gray-300">{item.section}</span>
                {item.external ? " (external)" : ""}
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
            <p className="text-gray-400 text-sm">ยังไม่มีลิงก์ Footer ในฐานข้อมูล</p>
            <button
              onClick={handleSeedDefaultItems}
              disabled={seedingDefaults}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {seedingDefaults ? "กำลังโหลดค่าเริ่มต้น..." : "โหลดลิงก์ Footer ค่าเริ่มต้น"}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="p-5 bg-gray-900/80 border border-gray-700 rounded-xl space-y-4">
          <h4 className="text-sm font-semibold text-white">{editingId ? "แก้ไขลิงก์" : "เพิ่มลิงก์ใหม่"}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Section</label>
              <select
                className={inputClass}
                value={isCustomSection ? "__custom__" : form.section}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === "__custom__") {
                    setForm((prev) => ({ ...prev, section: SECTION_OPTIONS.includes(prev.section) ? "" : prev.section }));
                    return;
                  }
                  setForm((prev) => ({ ...prev, section: next }));
                }}
              >
                {SECTION_OPTIONS.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
                <option value="__custom__">อื่นๆ (กำหนดเอง)</option>
              </select>
              {isCustomSection && (
                <input
                  className={`${inputClass} mt-2`}
                  list="footer-sections"
                  value={form.section}
                  onChange={(e) => setForm((prev) => ({ ...prev, section: e.target.value }))}
                  placeholder="custom-section"
                />
              )}
              <datalist id="footer-sections">
                {sectionOptions.map((section) => (
                  <option key={section} value={section} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelClass}>Label</label>
              <input
                className={inputClass}
                list="footer-label-suggestions"
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Contact"
              />
              <datalist id="footer-label-suggestions">
                {labelSuggestions.map((label) => (
                  <option key={label} value={label} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelClass}>Path / URL</label>
              <input
                className={inputClass}
                list="footer-path-options"
                value={form.path}
                onChange={(e) => setForm((prev) => ({ ...prev, path: e.target.value }))}
                placeholder="/service"
              />
              <datalist id="footer-path-options">
                {FOOTER_PATH_OPTIONS.map((path) => (
                  <option key={path} value={path} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelClass}>Display Order</label>
              <input
                className={inputClass}
                type="number"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, displayOrder: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.external}
                onChange={(e) => setForm((prev) => ({ ...prev, external: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-gray-300">ลิงก์ภายนอก (เปิดแท็บใหม่)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-gray-300">แสดงผลผ่านหน้าเว็บ</span>
            </label>
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-800 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
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
              เพิ่มลิงก์ Footer
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
