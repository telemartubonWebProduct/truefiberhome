"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadBannerImage } from "@/src/lib/storage";
import { lineSupport } from "@/src/context/line-path";
import { knowledgeArticles, solarBanner, solarProductInfo } from "@/src/data/solar";
import type { WEnergyKnowledgeItem } from "@/src/app/wEnergy/types";

interface SolarSectionData {
  id?: string;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  jsonData?: unknown;
  isActive: boolean;
}

interface SolarJsonData {
  heroTagline: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaUrl: string;
  heroSecondaryCtaLabel: string;
  productTitle: string;
  productSubtitle: string;
  productDescription: string;
  productPhone: string;
  packageSectionTitle: string;
  packageSectionSubtitle: string;
  knowledgeTitle: string;
  knowledgeSubtitle: string;
  knowledgeItems: WEnergyKnowledgeItem[];
}

interface Props {
  initialData: SolarSectionData | null;
}

const SOLAR_CTA_LABEL_OPTIONS = ["ปรึกษาฟรี", "ดูแพ็กเกจ", "นัดสำรวจหน้างาน", "ติดต่อทีมงาน"];
const SOLAR_CTA_URL_OPTIONS = [lineSupport, "/wEnergy", "/service"];

function buildDefaultKnowledgeItems(): WEnergyKnowledgeItem[] {
  return knowledgeArticles.slice(0, 3).map((item) => ({
    title: item.title,
    content: item.content,
    imageSrc: item.imageSrc,
    imageAlt: item.imageAlt,
  }));
}

function asText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeKnowledgeItems(value: unknown): WEnergyKnowledgeItem[] {
  const defaults = buildDefaultKnowledgeItems();

  if (!Array.isArray(value)) {
    return defaults;
  }

  const parsed = value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;

      const data = item as Record<string, unknown>;
      const fallback = defaults[index] || defaults[0];
      if (!fallback) return null;

      return {
        title: asText(data.title, fallback.title),
        content: asText(data.content, fallback.content),
        imageSrc: asText(data.imageSrc, fallback.imageSrc),
        imageAlt: asText(data.imageAlt, fallback.imageAlt),
      };
    })
    .filter((item): item is WEnergyKnowledgeItem => Boolean(item));

  if (parsed.length === 0) {
    return defaults;
  }

  return parsed.slice(0, 3);
}

function getInitialJsonData(jsonData: unknown): SolarJsonData {
  const defaults: SolarJsonData = {
    heroTagline: "W&W Energy",
    heroPrimaryCtaLabel: "ปรึกษาฟรี",
    heroPrimaryCtaUrl: lineSupport,
    heroSecondaryCtaLabel: "ดูแพ็กเกจ",
    productTitle: solarProductInfo.title,
    productSubtitle: solarProductInfo.subtitle,
    productDescription: solarProductInfo.description,
    productPhone: solarProductInfo.contactPhone,
    packageSectionTitle: "แพ็กเกจแนะนำ",
    packageSectionSubtitle: "ปรับราคาได้จากหลังบ้าน dashboard และอัปเดตขึ้นหน้านี้อัตโนมัติ",
    knowledgeTitle: "ความรู้พื้นฐานก่อนติดตั้ง",
    knowledgeSubtitle: "สรุปประเด็นสำคัญที่ควรรู้ก่อนตัดสินใจติดตั้งระบบโซล่าเซลล์",
    knowledgeItems: buildDefaultKnowledgeItems(),
  };

  if (!jsonData || typeof jsonData !== "object" || Array.isArray(jsonData)) {
    return defaults;
  }

  const data = jsonData as Record<string, unknown>;

  return {
    heroTagline: asText(data.heroTagline, defaults.heroTagline),
    heroPrimaryCtaLabel: asText(data.heroPrimaryCtaLabel, defaults.heroPrimaryCtaLabel),
    heroPrimaryCtaUrl: asText(data.heroPrimaryCtaUrl, defaults.heroPrimaryCtaUrl),
    heroSecondaryCtaLabel: asText(data.heroSecondaryCtaLabel, defaults.heroSecondaryCtaLabel),
    productTitle: asText(data.productTitle, defaults.productTitle),
    productSubtitle: asText(data.productSubtitle, defaults.productSubtitle),
    productDescription: asText(data.productDescription, defaults.productDescription),
    productPhone: asText(data.productPhone, defaults.productPhone),
    packageSectionTitle: asText(data.packageSectionTitle, defaults.packageSectionTitle),
    packageSectionSubtitle: asText(data.packageSectionSubtitle, defaults.packageSectionSubtitle),
    knowledgeTitle: asText(data.knowledgeTitle, defaults.knowledgeTitle),
    knowledgeSubtitle: asText(data.knowledgeSubtitle, defaults.knowledgeSubtitle),
    knowledgeItems: normalizeKnowledgeItems(data.knowledgeItems),
  };
}

function getDefaultHeroImage(): string {
  return solarBanner[0]?.image || "";
}

async function resolveImageUpload(file: File | null, preview: string): Promise<string> {
  if (file) {
    return uploadBannerImage(file);
  }

  if (preview.startsWith("blob:")) {
    return "";
  }

  return preview.trim();
}

export default function SolarContentForm({ initialData }: Props) {
  const router = useRouter();
  const initialJsonData = useMemo(() => getInitialJsonData(initialData?.jsonData), [initialData?.jsonData]);

  const [title, setTitle] = useState(initialData?.title ?? "ติดตั้งโซล่าเซลล์ครบวงจร");
  const [subtitle, setSubtitle] = useState(
    initialData?.subtitle ??
      "โซลูชันสำหรับบ้านและธุรกิจ ออกแบบโดยทีมวิศวกร พร้อมบริการสำรวจหน้างาน ติดตั้ง และดูแลหลังการขายในมาตรฐานเดียวกันทุกโปรเจกต์"
  );

  const [heroTagline, setHeroTagline] = useState(initialJsonData.heroTagline);
  const [heroPrimaryCtaLabel, setHeroPrimaryCtaLabel] = useState(initialJsonData.heroPrimaryCtaLabel);
  const [heroPrimaryCtaUrl, setHeroPrimaryCtaUrl] = useState(initialJsonData.heroPrimaryCtaUrl);
  const [heroSecondaryCtaLabel, setHeroSecondaryCtaLabel] = useState(initialJsonData.heroSecondaryCtaLabel);

  const [productTitle, setProductTitle] = useState(initialJsonData.productTitle);
  const [productSubtitle, setProductSubtitle] = useState(initialJsonData.productSubtitle);
  const [productDescription, setProductDescription] = useState(initialJsonData.productDescription);
  const [productPhone, setProductPhone] = useState(initialJsonData.productPhone);

  const [packageSectionTitle, setPackageSectionTitle] = useState(initialJsonData.packageSectionTitle);
  const [packageSectionSubtitle, setPackageSectionSubtitle] = useState(initialJsonData.packageSectionSubtitle);
  const [knowledgeTitle, setKnowledgeTitle] = useState(initialJsonData.knowledgeTitle);
  const [knowledgeSubtitle, setKnowledgeSubtitle] = useState(initialJsonData.knowledgeSubtitle);

  const [knowledgeItems, setKnowledgeItems] = useState<WEnergyKnowledgeItem[]>(initialJsonData.knowledgeItems);

  const [heroImagePreview, setHeroImagePreview] = useState(initialData?.imageUrl ?? getDefaultHeroImage());
  const [productImagePreview, setProductImagePreview] = useState(initialData?.linkUrl ?? solarProductInfo.imageSrc);

  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [knowledgeImageFiles, setKnowledgeImageFiles] = useState<Array<File | null>>([null, null, null]);

  const heroInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const knowledgeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nextJson = getInitialJsonData(initialData?.jsonData);

    setTitle(initialData?.title ?? "ติดตั้งโซล่าเซลล์ครบวงจร");
    setSubtitle(
      initialData?.subtitle ??
        "โซลูชันสำหรับบ้านและธุรกิจ ออกแบบโดยทีมวิศวกร พร้อมบริการสำรวจหน้างาน ติดตั้ง และดูแลหลังการขายในมาตรฐานเดียวกันทุกโปรเจกต์"
    );

    setHeroTagline(nextJson.heroTagline);
    setHeroPrimaryCtaLabel(nextJson.heroPrimaryCtaLabel);
    setHeroPrimaryCtaUrl(nextJson.heroPrimaryCtaUrl);
    setHeroSecondaryCtaLabel(nextJson.heroSecondaryCtaLabel);

    setProductTitle(nextJson.productTitle);
    setProductSubtitle(nextJson.productSubtitle);
    setProductDescription(nextJson.productDescription);
    setProductPhone(nextJson.productPhone);

    setPackageSectionTitle(nextJson.packageSectionTitle);
    setPackageSectionSubtitle(nextJson.packageSectionSubtitle);
    setKnowledgeTitle(nextJson.knowledgeTitle);
    setKnowledgeSubtitle(nextJson.knowledgeSubtitle);
    setKnowledgeItems(nextJson.knowledgeItems);

    setHeroImagePreview(initialData?.imageUrl ?? getDefaultHeroImage());
    setProductImagePreview(initialData?.linkUrl ?? solarProductInfo.imageSrc);
    setHeroImageFile(null);
    setProductImageFile(null);
    setKnowledgeImageFiles([null, null, null]);
    setIsActive(initialData?.isActive ?? true);
  }, [initialData]);

  const handleHeroFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    setHeroImageFile(file);
    setHeroImagePreview(URL.createObjectURL(file));
  };

  const handleProductFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const handleKnowledgeFileSelect = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setKnowledgeImageFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });

    setKnowledgeItems((prev) => {
      const next = [...prev];
      if (!next[index]) {
        next[index] = {
          title: `บทความ ${index + 1}`,
          content: "",
          imageSrc: previewUrl,
          imageAlt: `บทความ ${index + 1}`,
        };
      } else {
        next[index] = { ...next[index], imageSrc: previewUrl };
      }
      return next;
    });
  };

  const removeImage = (type: "hero" | "product") => {
    if (type === "hero") {
      setHeroImageFile(null);
      setHeroImagePreview("");
      if (heroInputRef.current) heroInputRef.current.value = "";
      return;
    }

    setProductImageFile(null);
    setProductImagePreview("");
    if (productInputRef.current) productInputRef.current.value = "";
  };

  const removeKnowledgeImage = (index: number) => {
    setKnowledgeImageFiles((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });

    setKnowledgeItems((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], imageSrc: "" };
      }
      return next;
    });

    const ref = knowledgeInputRefs.current[index];
    if (ref) ref.value = "";
  };

  const handleKnowledgeItemChange = (index: number, field: keyof WEnergyKnowledgeItem, value: string) => {
    setKnowledgeItems((prev) => {
      const next = [...prev];
      if (!next[index]) {
        next[index] = {
          title: `บทความ ${index + 1}`,
          content: "",
          imageSrc: "",
          imageAlt: `บทความ ${index + 1}`,
        };
      }
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const finalHeroImageUrl = await resolveImageUpload(heroImageFile, heroImagePreview);
      const finalProductImageUrl = await resolveImageUpload(productImageFile, productImagePreview);

      const finalKnowledgeItems = await Promise.all(
        knowledgeItems.slice(0, 3).map(async (item, index) => {
          const current = item || {
            title: `บทความ ${index + 1}`,
            content: "",
            imageSrc: "",
            imageAlt: `บทความ ${index + 1}`,
          };

          let finalImageSrc = current.imageSrc || "";
          const imageFile = knowledgeImageFiles[index];
          if (imageFile) {
            finalImageSrc = await uploadBannerImage(imageFile);
          } else if (finalImageSrc.startsWith("blob:")) {
            finalImageSrc = "";
          }

          const trimmedTitle = current.title.trim() || `บทความ ${index + 1}`;

          return {
            title: trimmedTitle,
            content: current.content.trim(),
            imageSrc: finalImageSrc,
            imageAlt: current.imageAlt.trim() || trimmedTitle,
          };
        })
      );

      const res = await fetch("/api/home-sections/wEnergyPageContent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          imageUrl: finalHeroImageUrl || null,
          linkUrl: finalProductImageUrl || null,
          jsonData: {
            heroTagline,
            heroPrimaryCtaLabel,
            heroPrimaryCtaUrl,
            heroSecondaryCtaLabel,
            productTitle,
            productSubtitle,
            productDescription,
            productPhone,
            packageSectionTitle,
            packageSectionSubtitle,
            knowledgeTitle,
            knowledgeSubtitle,
            knowledgeItems: finalKnowledgeItems,
          },
          isActive,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save solar content");
      }

      setMessage("บันทึกคอนเทนต์หน้า Solar สำเร็จ!");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("ยืนยันการล้างข้อมูลคอนเทนต์หน้า Solar?");
    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/home-sections/wEnergyPageContent", {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      setMessage("ล้างข้อมูลคอนเทนต์หน้า Solar สำเร็จ!");
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tagline ส่วน Hero</label>
          <input className={inputClass} value={heroTagline} onChange={(e) => setHeroTagline(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>ปุ่มรองใน Hero</label>
          <input className={inputClass} list="solar-cta-label-options" value={heroSecondaryCtaLabel} onChange={(e) => setHeroSecondaryCtaLabel(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>หัวข้อ Hero</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>คำอธิบาย Hero</label>
          <textarea className={`${inputClass} min-h-[100px] resize-y`} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>ปุ่มหลักใน Hero</label>
          <input className={inputClass} list="solar-cta-label-options" value={heroPrimaryCtaLabel} onChange={(e) => setHeroPrimaryCtaLabel(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>ลิงก์ปุ่มหลัก</label>
          <input className={inputClass} list="solar-cta-url-options" value={heroPrimaryCtaUrl} onChange={(e) => setHeroPrimaryCtaUrl(e.target.value)} placeholder="https://..." />
        </div>

        <datalist id="solar-cta-label-options">
          {SOLAR_CTA_LABEL_OPTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>

        <datalist id="solar-cta-url-options">
          {SOLAR_CTA_URL_OPTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
          <label className={labelClass}>รูป Hero</label>
          <input
            className={inputClass}
            value={!heroImageFile && heroImagePreview && !heroImagePreview.startsWith("blob:") ? heroImagePreview : ""}
            onChange={(e) => {
              setHeroImageFile(null);
              setHeroImagePreview(e.target.value);
            }}
            placeholder="วาง URL รูป หรืออัปโหลดไฟล์"
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
              อัปโหลดรูป Hero
            </button>
          )}
          <input ref={heroInputRef} type="file" accept="image/*" onChange={handleHeroFileSelect} className="hidden" />
        </div>

        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
          <label className={labelClass}>รูป Product Overview</label>
          <input
            className={inputClass}
            value={!productImageFile && productImagePreview && !productImagePreview.startsWith("blob:") ? productImagePreview : ""}
            onChange={(e) => {
              setProductImageFile(null);
              setProductImagePreview(e.target.value);
            }}
            placeholder="วาง URL รูป หรืออัปโหลดไฟล์"
          />
          {productImagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50 p-3">
              <img src={productImagePreview} alt="Product preview" className="w-full h-40 object-cover rounded-lg" />
              <div className="mt-2 flex justify-between items-center">
                <button type="button" onClick={() => productInputRef.current?.click()} className="text-xs text-blue-400 hover:text-blue-300">
                  เลือกไฟล์ใหม่
                </button>
                <button type="button" onClick={() => removeImage("product")} className="text-xs text-red-400 hover:text-red-300">
                  ลบรูป
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => productInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl py-6 text-sm text-gray-400 hover:text-white transition-colors"
            >
              อัปโหลดรูป Product
            </button>
          )}
          <input ref={productInputRef} type="file" accept="image/*" onChange={handleProductFileSelect} className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>หัวข้อ Product</label>
          <input className={inputClass} value={productTitle} onChange={(e) => setProductTitle(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>คำโปรย Product</label>
          <input className={inputClass} value={productSubtitle} onChange={(e) => setProductSubtitle(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>รายละเอียด Product</label>
          <textarea className={`${inputClass} min-h-[100px] resize-y`} value={productDescription} onChange={(e) => setProductDescription(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>เบอร์ติดต่อ Product</label>
          <input className={inputClass} value={productPhone} onChange={(e) => setProductPhone(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>หัวข้อ Section แพ็กเกจ</label>
          <input className={inputClass} value={packageSectionTitle} onChange={(e) => setPackageSectionTitle(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>คำอธิบาย Section แพ็กเกจ</label>
          <input className={inputClass} value={packageSectionSubtitle} onChange={(e) => setPackageSectionSubtitle(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>หัวข้อ Section ความรู้</label>
          <input className={inputClass} value={knowledgeTitle} onChange={(e) => setKnowledgeTitle(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>คำอธิบาย Section ความรู้</label>
          <input className={inputClass} value={knowledgeSubtitle} onChange={(e) => setKnowledgeSubtitle(e.target.value)} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">การ์ดความรู้ (3 ใบ)</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {knowledgeItems.slice(0, 3).map((item, index) => (
            <div key={`knowledge-${index}`} className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 space-y-3">
              <label className={labelClass}>หัวข้อ</label>
              <input
                className={inputClass}
                value={item.title}
                onChange={(e) => handleKnowledgeItemChange(index, "title", e.target.value)}
              />

              <label className={labelClass}>เนื้อหา</label>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                value={item.content}
                onChange={(e) => handleKnowledgeItemChange(index, "content", e.target.value)}
              />

              <label className={labelClass}>รูปภาพ</label>
              <input
                className={inputClass}
                value={!knowledgeImageFiles[index] && item.imageSrc && !item.imageSrc.startsWith("blob:") ? item.imageSrc : ""}
                onChange={(e) => handleKnowledgeItemChange(index, "imageSrc", e.target.value)}
                placeholder="URL รูปภาพ"
              />

              {item.imageSrc ? (
                <div className="rounded-lg overflow-hidden border border-gray-700 bg-gray-800/50 p-2">
                  <img src={item.imageSrc} alt={item.imageAlt || item.title} className="w-full h-28 object-cover rounded-md" />
                  <div className="mt-2 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => knowledgeInputRefs.current[index]?.click()}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      เลือกไฟล์ใหม่
                    </button>
                    <button
                      type="button"
                      onClick={() => removeKnowledgeImage(index)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      ลบรูป
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => knowledgeInputRefs.current[index]?.click()}
                  className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl py-5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  อัปโหลดรูปการ์ด {index + 1}
                </button>
              )}

              <input
                ref={(el) => {
                  knowledgeInputRefs.current[index] = el;
                }}
                type="file"
                accept="image/*"
                onChange={(e) => handleKnowledgeFileSelect(e, index)}
                className="hidden"
              />
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-300">แสดงผลหน้า /wEnergy</span>
      </label>

      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-800">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก Solar Content"}
        </button>

        <button
          onClick={handleDelete}
          disabled={saving}
          className="px-5 py-2 bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          ล้างข้อมูล
        </button>

        {message && (
          <span className={`text-sm ${message.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
