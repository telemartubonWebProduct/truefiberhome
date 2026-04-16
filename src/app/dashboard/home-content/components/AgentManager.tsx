"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { uploadBannerImage } from "@/src/lib/storage";

interface AgentItem {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  closedDeal: number;
  photoUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

interface Props {
  initialAgents: AgentItem[];
}

const ROLE_OPTIONS = [
  "เซลล์ประจำพื้นที่",
  "ที่ปรึกษาแพ็กเกจ",
  "เจ้าหน้าที่บริการลูกค้า",
  "ทีมติดตั้ง",
  "ทีมเทคนิค",
];

const PHONE_SUGGESTIONS = ["0910192552", "0902518964", "0841041506"];

export default function AgentManager({ initialAgents }: Props) {
  const [agents, setAgents] = useState<AgentItem[]>(initialAgents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    role: ROLE_OPTIONS[0],
    closedDeal: 0,
    photoUrl: "",
    displayOrder: 0,
    isActive: true,
  });

  // Sync state when props change (after router.refresh())
  useEffect(() => {
    setAgents(initialAgents);
  }, [initialAgents]);

  const roleSuggestions = useMemo(() => {
    const dynamic = agents.map((agent) => agent.role).filter(Boolean);
    return Array.from(new Set([...ROLE_OPTIONS, ...dynamic]));
  }, [agents]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const resetForm = () => {
    setForm({
      name: "",
      phoneNumber: "",
      role: ROLE_OPTIONS[0],
      closedDeal: 0,
      photoUrl: "",
      displayOrder: agents.length,
      isActive: true,
    });
    setEditingId(null);
    setImageFile(null);
    setShowForm(false);
  };

  const startEdit = (a: AgentItem) => {
    setForm({ name: a.name, phoneNumber: a.phoneNumber, role: a.role, closedDeal: a.closedDeal, photoUrl: a.photoUrl ?? "", displayOrder: a.displayOrder, isActive: a.isActive });
    setEditingId(a.id);
    setImageFile(null);
    setShowForm(true);
  };

  const startAdd = () => {
    resetForm();
    setForm((f) => ({ ...f, displayOrder: agents.length }));
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
    setForm({ ...form, photoUrl: previewUrl });
  };

  const removeImage = () => {
    setImageFile(null);
    setForm({ ...form, photoUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      let finalPhotoUrl = form.photoUrl || null;
      if (imageFile) {
        finalPhotoUrl = await uploadBannerImage(imageFile);
      } else if (form.photoUrl && !form.photoUrl.includes("blob:")) {
        finalPhotoUrl = form.photoUrl;
      } else if (form.photoUrl?.includes("blob:")) {
        // Fallback if blob is stuck without file
        finalPhotoUrl = null;
      }

      const payload = { ...form, photoUrl: finalPhotoUrl };
      
      if (editingId) {
        const res = await fetch(`/api/agents/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        const updated = await res.json();
        setAgents(agents.map((a) => (a.id === editingId ? updated : a)));
      } else {
        const res = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        const created = await res.json();
        setAgents([...agents, created]);
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
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setAgents(agents.filter((a) => a.id !== id));
      setMessage("ลบสำเร็จ!");
    } catch {
      setMessage("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const inputClass = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";
  const isCustomRole = !ROLE_OPTIONS.includes(form.role);

  return (
    <div className="space-y-4">
      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-14 h-14 rounded-xl bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {agent.photoUrl ? <img src={agent.photoUrl} alt={agent.name} className="w-full h-full object-cover" /> : <span className="text-2xl">👤</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{agent.name}</p>
                <p className="text-red-400 text-xs font-medium">{agent.phoneNumber}</p>
                <p className="text-gray-500 text-xs">{agent.role}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">ปิดจบ:</span>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full text-xs font-bold">{agent.closedDeal}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${agent.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-600/20 text-gray-500"}`}>
                  {agent.isActive ? "แสดง" : "ซ่อน"}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(agent)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg></button>
                <button onClick={() => handleDelete(agent.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {agents.length === 0 && <p className="text-gray-500 text-sm text-center py-8">ยังไม่มีข้อมูลเจ้าหน้าที่ — กดปุ่มด้านล่างเพื่อเพิ่ม</p>}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="p-5 bg-gray-900/80 border border-gray-700 rounded-xl space-y-4">
          <h4 className="text-sm font-semibold text-white">{editingId ? "แก้ไขเจ้าหน้าที่" : "เพิ่มเจ้าหน้าที่ใหม่"}</h4>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            
            {/* Image Uploader */}
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <label className={labelClass}>รูปภาพเจ้าหน้าที่ (Photo URL หรือ อัปโหลด)</label>
              <div className="mb-3">
                <input
                  className={inputClass}
                  value={!imageFile && form.photoUrl && !form.photoUrl.includes("blob:") ? form.photoUrl : ""}
                  onChange={(e) => {
                    const url = e.target.value;
                    setImageFile(null);
                    setForm({ ...form, photoUrl: url });
                  }}
                  placeholder="https://... หรือคลิกอัปโหลดด้านล่าง"
                />
              </div>

              {form.photoUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-800 flex flex-col items-center p-3 h-32">
                  <img src={form.photoUrl} alt="Preview" className="h-full object-contain" />
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
              <div><label className={labelClass}>ชื่อ</label><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="สิมา เกษมสิทธิ์" /></div>
              <div>
                <label className={labelClass}>เบอร์โทร</label>
                <input
                  className={inputClass}
                  type="tel"
                  list="agent-phone-suggestions"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  placeholder="089-123-4567"
                />
                <datalist id="agent-phone-suggestions">
                  {PHONE_SUGGESTIONS.map((phone) => (
                    <option key={phone} value={phone} />
                  ))}
                </datalist>
              </div>
              <div className="md:col-span-2 space-y-2">
                <div>
                  <label className={labelClass}>ตำแหน่ง</label>
                  <select
                    className={inputClass}
                    value={isCustomRole ? "__custom__" : form.role}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next === "__custom__") {
                        setForm((prev) => ({ ...prev, role: ROLE_OPTIONS.includes(prev.role) ? "" : prev.role }));
                        return;
                      }
                      setForm((prev) => ({ ...prev, role: next }));
                    }}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                    <option value="__custom__">อื่นๆ (กำหนดเอง)</option>
                  </select>
                </div>

                {isCustomRole && (
                  <div>
                    <label className={labelClass}>ตำแหน่งแบบกำหนดเอง</label>
                    <input
                      className={inputClass}
                      list="agent-role-suggestions"
                      value={form.role}
                      onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                      placeholder="ระบุตำแหน่งเพิ่มเติม"
                    />
                    <datalist id="agent-role-suggestions">
                      {roleSuggestions.map((role) => (
                        <option key={role} value={role} />
                      ))}
                    </datalist>
                  </div>
                )}
              </div>
              <div><label className={labelClass}>ปิดจบงาน</label><input className={inputClass} type="number" value={form.closedDeal} onChange={(e) => setForm({ ...form, closedDeal: Number(e.target.value) })} /></div>
              <div><label className={labelClass}>ลำดับ</label><input className={inputClass} type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></div>
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
            เพิ่มเจ้าหน้าที่
          </button>
        )}
        {message && <span className={`text-sm ${message.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}>{message}</span>}
      </div>
    </div>
  );
}
