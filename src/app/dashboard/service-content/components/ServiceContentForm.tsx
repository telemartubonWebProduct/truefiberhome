"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { uploadBannerImage } from "@/src/lib/storage";
import { useRouter } from "next/navigation";
import { lineSupport } from "@/src/context/line-path";

interface ServiceSectionData {
  id?: string;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  jsonData?: unknown;
  isActive: boolean;
}

interface ServiceJsonData {
  topCtaLabel: string;
  topCtaHref: string;
  phone: string;
  lineUrl: string;
  facebookUrl: string;
  locationLabel: string;
  locationUrl: string;
  mapEmbedUrl: string;
  mapCoordinates: string;
  aboutTitle: string;
  aboutDescription: string;
  contactNote: string;
}

interface Props {
  initialData: ServiceSectionData | null;
}

const SERVICE_CTA_LABEL_OPTIONS = ["เช็กพื้นที่บริการติดตั้ง/ย้ายจุด", "เช็กพื้นที่บริการ", "นัดทีมติดตั้ง"];
const SERVICE_LINK_OPTIONS = [lineSupport, "/service", "/boardband", "/home#packages"];
const FACEBOOK_LINK_OPTIONS = ["https://www.facebook.com/profile.php?id=61558200500505", "https://facebook.com/"];

function normalizeEmbedInput(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("<")) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    return srcMatch?.[1]?.trim() || "";
  }

  return trimmed;
}

function getInitialJsonData(jsonData: unknown): ServiceJsonData {
  const defaults: ServiceJsonData = {
    topCtaLabel: "เช็กพื้นที่บริการติดตั้ง/ย้ายจุด",
    topCtaHref: lineSupport,
    phone: "0910192552",
    lineUrl: lineSupport,
    facebookUrl: "",
    locationLabel: "สำนักงานใหญ่อุบลราชธานี",
    locationUrl: "",
    mapEmbedUrl: "",
    mapCoordinates: "15.2384, 104.8487",
    aboutTitle: "เกี่ยวกับบริการของเรา",
    aboutDescription:
      "เราให้บริการตรวจสอบพื้นที่ ติดตั้งอินเทอร์เน็ต ย้ายจุด และดูแลหลังการขายโดยทีมงานมืออาชีพ พร้อมให้คำแนะนำอย่างตรงไปตรงมา",
    contactNote:
      "ติดต่อทีมงานเพื่อเช็กพิกัดบริการ นัดหมายติดตั้ง และสอบถามเงื่อนไขแพ็กเกจล่าสุดได้ทันที",
  };

  if (!jsonData || typeof jsonData !== "object" || Array.isArray(jsonData)) {
    return defaults;
  }

  const data = jsonData as Record<string, unknown>;
  return {
    topCtaLabel: typeof data.topCtaLabel === "string" ? data.topCtaLabel : defaults.topCtaLabel,
    topCtaHref:
      typeof data.topCtaHref === "string" && data.topCtaHref.trim() && data.topCtaHref.trim() !== "/service" && data.topCtaHref.trim() !== "#"
        ? data.topCtaHref.trim()
        : defaults.topCtaHref,
    phone: typeof data.phone === "string" ? data.phone : defaults.phone,
    lineUrl:
      typeof data.lineUrl === "string" && data.lineUrl.trim() && data.lineUrl.trim() !== "/service" && data.lineUrl.trim() !== "#"
        ? data.lineUrl.trim()
        : defaults.lineUrl,
    facebookUrl: typeof data.facebookUrl === "string" ? data.facebookUrl : defaults.facebookUrl,
    locationLabel: typeof data.locationLabel === "string" ? data.locationLabel : defaults.locationLabel,
    locationUrl: typeof data.locationUrl === "string" ? data.locationUrl : defaults.locationUrl,
    mapEmbedUrl: normalizeEmbedInput(data.mapEmbedUrl),
    mapCoordinates: typeof data.mapCoordinates === "string" ? data.mapCoordinates : defaults.mapCoordinates,
    aboutTitle: typeof data.aboutTitle === "string" ? data.aboutTitle : defaults.aboutTitle,
    aboutDescription: typeof data.aboutDescription === "string" ? data.aboutDescription : defaults.aboutDescription,
    contactNote: typeof data.contactNote === "string" ? data.contactNote : defaults.contactNote,
  };
}

export default function ServiceContentForm({ initialData }: Props) {
  const router = useRouter();
  const initialJsonData = useMemo(() => getInitialJsonData(initialData?.jsonData), [initialData?.jsonData]);

  const [title, setTitle] = useState(initialData?.title ?? "บริการเช็กพื้นที่ ติดตั้ง และย้ายจุด");
  const [subtitle, setSubtitle] = useState(
    initialData?.subtitle ?? "ตรวจสอบพิกัดพื้นที่บริการ ติดตั้งอินเทอร์เน็ต และย้ายจุดใช้งานได้ในที่เดียว"
  );

  const [heroImagePreview, setHeroImagePreview] = useState<string>(initialData?.imageUrl ?? "");
  const [detailImagePreview, setDetailImagePreview] = useState<string>(initialData?.linkUrl ?? "");

  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [detailImageFile, setDetailImageFile] = useState<File | null>(null);

  const heroInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);

  const [topCtaLabel, setTopCtaLabel] = useState(initialJsonData.topCtaLabel);
  const [topCtaHref, setTopCtaHref] = useState(initialJsonData.topCtaHref);
  const [phone, setPhone] = useState(initialJsonData.phone);
  const [lineUrl, setLineUrl] = useState(initialJsonData.lineUrl);
  const [facebookUrl, setFacebookUrl] = useState(initialJsonData.facebookUrl);
  const [locationLabel, setLocationLabel] = useState(initialJsonData.locationLabel);
  const [locationUrl, setLocationUrl] = useState(initialJsonData.locationUrl);
  const [mapEmbedUrl, setMapEmbedUrl] = useState(initialJsonData.mapEmbedUrl);
  const [mapCoordinates, setMapCoordinates] = useState(initialJsonData.mapCoordinates);
  const [aboutTitle, setAboutTitle] = useState(initialJsonData.aboutTitle);
  const [aboutDescription, setAboutDescription] = useState(initialJsonData.aboutDescription);
  const [contactNote, setContactNote] = useState(initialJsonData.contactNote);

  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nextJsonData = getInitialJsonData(initialData?.jsonData);

    setTitle(initialData?.title ?? "บริการเช็กพื้นที่ ติดตั้ง และย้ายจุด");
    setSubtitle(
      initialData?.subtitle ?? "ตรวจสอบพิกัดพื้นที่บริการ ติดตั้งอินเทอร์เน็ต และย้ายจุดใช้งานได้ในที่เดียว"
    );

    setHeroImagePreview(initialData?.imageUrl ?? "");
    setDetailImagePreview(initialData?.linkUrl ?? "");
    setHeroImageFile(null);
    setDetailImageFile(null);

    setTopCtaLabel(nextJsonData.topCtaLabel);
    setTopCtaHref(nextJsonData.topCtaHref);
    setPhone(nextJsonData.phone);
    setLineUrl(nextJsonData.lineUrl);
    setFacebookUrl(nextJsonData.facebookUrl);
    setLocationLabel(nextJsonData.locationLabel);
    setLocationUrl(nextJsonData.locationUrl);
    setMapEmbedUrl(nextJsonData.mapEmbedUrl);
    setMapCoordinates(nextJsonData.mapCoordinates);
    setAboutTitle(nextJsonData.aboutTitle);
    setAboutDescription(nextJsonData.aboutDescription);
    setContactNote(nextJsonData.contactNote);
    setIsActive(initialData?.isActive ?? true);
  }, [initialData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "hero" | "detail") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (type === "hero") {
      setHeroImageFile(file);
      setHeroImagePreview(previewUrl);
    } else {
      setDetailImageFile(file);
      setDetailImagePreview(previewUrl);
    }
  };

  const removeImage = (type: "hero" | "detail") => {
    if (type === "hero") {
      setHeroImageFile(null);
      setHeroImagePreview("");
      if (heroInputRef.current) heroInputRef.current.value = "";
    } else {
      setDetailImageFile(null);
      setDetailImagePreview("");
      if (detailInputRef.current) detailInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      let finalHeroImageUrl = heroImagePreview;
      let finalDetailImageUrl = detailImagePreview;

      if (heroImageFile) {
        finalHeroImageUrl = await uploadBannerImage(heroImageFile);
      } else if (heroImagePreview.startsWith("blob:")) {
        finalHeroImageUrl = "";
      }

      if (detailImageFile) {
        finalDetailImageUrl = await uploadBannerImage(detailImageFile);
      } else if (detailImagePreview.startsWith("blob:")) {
        finalDetailImageUrl = "";
      }

      const res = await fetch("/api/home-sections/servicePageContent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          imageUrl: finalHeroImageUrl || null,
          linkUrl: finalDetailImageUrl || null,
          jsonData: {
            topCtaLabel,
            topCtaHref,
            phone,
            lineUrl,
            facebookUrl,
            locationLabel,
            locationUrl,
            mapEmbedUrl: normalizeEmbedInput(mapEmbedUrl),
            mapCoordinates,
            aboutTitle,
            aboutDescription,
            contactNote,
          },
          isActive,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save service page content");
      }

      setMessage("บันทึกข้อมูลหน้า Service สำเร็จ!");
    } catch (error) {
      console.error(error);
      setMessage("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("ยืนยันการล้างข้อมูลหน้า Service ทั้งหมด?");
    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/home-sections/servicePageContent", {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete service content");
      }

      setMessage("ล้างข้อมูลหน้า Service สำเร็จ!");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("เกิดข้อผิดพลาดในการล้างข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelClass}>หัวข้อส่วนบน</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>คำอธิบายส่วนบน</label>
          <textarea
            className={`${inputClass} min-h-[90px] resize-y`}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>ข้อความปุ่มเช็กพื้นที่</label>
          <input className={inputClass} list="service-cta-label-options" value={topCtaLabel} onChange={(e) => setTopCtaLabel(e.target.value)} />
          <datalist id="service-cta-label-options">
            {SERVICE_CTA_LABEL_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={labelClass}>ลิงก์ปุ่มเช็กพื้นที่</label>
          <input className={inputClass} list="service-link-options" value={topCtaHref} onChange={(e) => setTopCtaHref(e.target.value)} placeholder="/service หรือ https://..." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
          <label className={labelClass}>รูปภาพส่วนบน (ภาพที่ 1)</label>
          <input
            className={inputClass}
            value={!heroImageFile && heroImagePreview && !heroImagePreview.startsWith("blob:") ? heroImagePreview : ""}
            onChange={(e) => {
              setHeroImageFile(null);
              setHeroImagePreview(e.target.value);
            }}
            placeholder="วาง URL รูปภาพ หรืออัปโหลดไฟล์"
          />
          {heroImagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 p-3">
              <img src={heroImagePreview} alt="Hero preview" className="w-full h-40 object-cover rounded-lg" />
              <div className="mt-2 flex justify-between items-center">
                <button type="button" onClick={() => heroInputRef.current?.click()} className="text-xs text-blue-400 hover:text-blue-300">
                  เลือกไฟล์ใหม่
                </button>
                <button type="button" onClick={() => removeImage("hero")} className="text-xs text-red-400 hover:text-red-300">
                  ลบรูป
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => heroInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl py-6 text-sm text-gray-400 hover:text-white transition-colors"
            >
              อัปโหลดรูปภาพที่ 1
            </button>
          )}
          <input ref={heroInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, "hero")} className="hidden" />
        </div>

        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
          <label className={labelClass}>รูปภาพรายละเอียด (ภาพที่ 2)</label>
          <input
            className={inputClass}
            value={!detailImageFile && detailImagePreview && !detailImagePreview.startsWith("blob:") ? detailImagePreview : ""}
            onChange={(e) => {
              setDetailImageFile(null);
              setDetailImagePreview(e.target.value);
            }}
            placeholder="วาง URL รูปภาพ หรืออัปโหลดไฟล์"
          />
          {detailImagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 p-3">
              <img src={detailImagePreview} alt="Detail preview" className="w-full h-40 object-cover rounded-lg" />
              <div className="mt-2 flex justify-between items-center">
                <button type="button" onClick={() => detailInputRef.current?.click()} className="text-xs text-blue-400 hover:text-blue-300">
                  เลือกไฟล์ใหม่
                </button>
                <button type="button" onClick={() => removeImage("detail")} className="text-xs text-red-400 hover:text-red-300">
                  ลบรูป
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => detailInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl py-6 text-sm text-gray-400 hover:text-white transition-colors"
            >
              อัปโหลดรูปภาพที่ 2
            </button>
          )}
          <input ref={detailInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, "detail")} className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>เบอร์ติดต่อ</label>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>ลิงก์ Line</label>
          <input className={inputClass} list="service-link-options" value={lineUrl} onChange={(e) => setLineUrl(e.target.value)} placeholder="https://lin.ee/..." />
        </div>
        <div>
          <label className={labelClass}>ลิงก์ Facebook</label>
          <input className={inputClass} list="service-facebook-options" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." />
        </div>
        <div>
          <label className={labelClass}>ชื่อพิกัด/ที่ตั้ง</label>
          <input className={inputClass} value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} placeholder="สำนักงานใหญ่..." />
        </div>
        <div>
          <label className={labelClass}>พิกัด (lat,lng)</label>
          <input className={inputClass} value={mapCoordinates} onChange={(e) => setMapCoordinates(e.target.value)} placeholder="15.2384, 104.8487" />
        </div>
        <div>
          <label className={labelClass}>ลิงก์แผนที่ (Google Maps URL)</label>
          <input className={inputClass} value={locationUrl} onChange={(e) => setLocationUrl(e.target.value)} placeholder="https://maps.app.goo.gl/..." />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Embed Map URL หรือโค้ด iframe (ถ้ามี)</label>
          <input
            className={inputClass}
            value={mapEmbedUrl}
            onChange={(e) => setMapEmbedUrl(e.target.value)}
            placeholder="https://www.google.com/maps/embed?... หรือ <iframe ...>"
          />
        </div>

        <datalist id="service-link-options">
          {SERVICE_LINK_OPTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>

        <datalist id="service-facebook-options">
          {FACEBOOK_LINK_OPTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className={labelClass}>หัวข้อส่วนเกี่ยวกับเรา</label>
          <input className={inputClass} value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>คำอธิบายส่วนเกี่ยวกับเรา</label>
          <textarea className={`${inputClass} min-h-[100px] resize-y`} value={aboutDescription} onChange={(e) => setAboutDescription(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>หมายเหตุการติดต่อเพิ่มเติม</label>
          <textarea className={`${inputClass} min-h-[80px] resize-y`} value={contactNote} onChange={(e) => setContactNote(e.target.value)} />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-300">แสดงหน้า Service Content</span>
      </label>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-800 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก Service Page"}
        </button>
        <button
          onClick={handleDelete}
          disabled={saving}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          ล้างข้อมูล Section
        </button>
        {message && (
          <span className={`text-sm ${message.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}>{message}</span>
        )}
      </div>
    </div>
  );
}
