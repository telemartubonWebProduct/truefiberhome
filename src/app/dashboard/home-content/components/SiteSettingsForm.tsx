"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadBannerImage } from "@/src/lib/storage";

interface SiteSettings {
  id: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  footerImageUrl: string | null;
  lineSupportUrl: string | null;
}

interface SiteSettingsFormProps {
  initialSettings: SiteSettings;
}

const PHONE_SUGGESTIONS = ["0910192552", "0902518964", "0841041506"];
const LINE_URL_SUGGESTIONS = ["https://lin.ee/6jZ9SNX", "https://lin.ee/"];

export default function SiteSettingsForm({ initialSettings }: SiteSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [phone, setPhone] = useState(initialSettings.phone || "");
  const [email, setEmail] = useState(initialSettings.email || "");
  const [description, setDescription] = useState(initialSettings.description || "");
  const [lineSupportUrl, setLineSupportUrl] = useState(initialSettings.lineSupportUrl || "");

  // Files & Previews
  const logoInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings.logoUrl);

  const [footerFile, setFooterFile] = useState<File | null>(null);
  const [footerPreview, setFooterPreview] = useState<string | null>(initialSettings.footerImageUrl);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "footer") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(previewUrl);
    } else {
      setFooterFile(file);
      setFooterPreview(previewUrl);
    }
    setError(null);
  };

  const removeImage = (type: "logo" | "footer") => {
    if (type === "logo") {
      setLogoFile(null);
      setLogoPreview(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
    } else {
      setFooterFile(null);
      setFooterPreview(null);
      if (footerInputRef.current) footerInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let finalLogoUrl = logoPreview && !logoPreview.startsWith("blob:") ? logoPreview : null;
      let finalFooterUrl = footerPreview && !footerPreview.startsWith("blob:") ? footerPreview : null;

      if (logoFile) finalLogoUrl = await uploadBannerImage(logoFile);
      if (footerFile) finalFooterUrl = await uploadBannerImage(footerFile);

      const body = {
        logoUrl: finalLogoUrl || "",
        footerImageUrl: finalFooterUrl || "",
        phone: phone || "",
        email: email || "",
        description: description || "",
        lineSupportUrl: lineSupportUrl || "",
      };

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccessMsg("Settings updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const ImageUploader = ({
    title,
    preview,
    inputRef,
    type,
    file,
  }: {
    title: string;
    preview: string | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    type: "logo" | "footer";
    file: File | null;
  }) => (
    <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-800">
      <label className="block text-sm font-medium text-gray-300 mb-2">{title}</label>
      
      {/* URL Input Option */}
      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-1">
          Or paste an external Image URL
        </label>
        <input
          type="url"
          value={!file && preview && !preview.includes('blob:') ? preview : ''}
          onChange={(e) => {
            const url = e.target.value;
            // Clear file if they are typing a URL
            if (type === "logo") {
              setLogoFile(null);
              setLogoPreview(url);
            } else {
              setFooterFile(null);
              setFooterPreview(url);
            }
          }}
          placeholder="https://example.com/logo.png"
          className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-xs"
        />
      </div>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 flex flex-col items-center justify-center p-4">
          <div className="relative h-24 w-full max-w-[200px]">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
              sizes="200px"
            />
          </div>
          <div className="absolute top-2 right-2">
            <button
              type="button"
              onClick={() => removeImage(type)}
              className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors"
              title="Remove image"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="w-full flex justify-between items-center mt-4">
            {file ? (
              <p className="text-xs text-emerald-400 text-center flex-1">
                New file: {file.name}
              </p>
            ) : (
              <p className="text-xs text-gray-400 text-center flex-1 truncate px-2">
                {preview === initialSettings.logoUrl || preview === initialSettings.footerImageUrl ? "Current Image" : "External URL"}
              </p>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
            >
              Upload file
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
        >
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-gray-400">Click to attach image file</p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, type)}
        className="hidden"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm">
          {successMsg}
        </div>
      )}

      {/* Image Upload Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImageUploader title="Header Logo (โลโก้เว็บไซต์)" preview={logoPreview} inputRef={logoInputRef} type="logo" file={logoFile} />
        <ImageUploader title="Footer Logo (โลโก้ท้ายเว็บ)" preview={footerPreview} inputRef={footerInputRef} type="footer" file={footerFile} />
      </div>

      {/* Text Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
          <input
            type="tel"
            list="site-phone-suggestions"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm"
            placeholder="e.g., 1234 or 02-xxx-xxxx"
          />
          <datalist id="site-phone-suggestions">
            {PHONE_SUGGESTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm"
            placeholder="e.g., contact@telemart.com"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Line Support URL (ลิงก์ติดต่อส่วนกลาง)</label>
          <input
            type="url"
            list="site-line-suggestions"
            value={lineSupportUrl}
            onChange={(e) => setLineSupportUrl(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm"
            placeholder="e.g., https://lin.ee/xxxxxx"
          />
          <datalist id="site-line-suggestions">
            {LINE_URL_SUGGESTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-gray-400">ลิงก์นี้จะใช้เป็นค่าเริ่มต้นสำหรับปุ่ม "สนใจสมัครบริการ" หากแพ็กเกจนั้นๆ ไม่ได้ระบุลิงก์ไว้</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Website Description (เนื้อหาแนะนำ/Footer Text)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm resize-none"
          placeholder="Short description snippet seen in footer..."
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-800">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
