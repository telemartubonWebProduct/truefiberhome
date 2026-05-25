"use client";

import { useEffect, useState } from "react";
import BlockEditor from "./BlockEditor";
import type { Block } from "@/src/lib/article-blocks";

export interface ArticleFormValues {
  title: string;
  slug: string;
  excerpt: string;
  contentBlocks: Block[];
  coverImage: string;
  category: string;
  tags: string;
  layout: string;
  author: string;
  readingTime: number;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  displayOrder: number;
}

interface Props {
  initialValues: ArticleFormValues;
  isCreating: boolean;
  isSaving: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: ArticleFormValues) => Promise<void> | void;
}

const LAYOUTS = [
  {
    id: "default",
    label: "Default",
    description: "ข้อความตรงกลาง อ่านง่าย เหมาะกับบทความทั่วไป",
    preview: (
      <svg viewBox="0 0 80 60" className="h-full w-full">
        <rect x="0" y="0" width="80" height="60" rx="4" className="fill-gray-800" />
        <rect x="22" y="8" width="36" height="3" rx="1.5" className="fill-gray-500" />
        <rect x="14" y="15" width="52" height="14" rx="2" className="fill-gray-600" />
        <rect x="22" y="34" width="36" height="2" rx="1" className="fill-gray-500" />
        <rect x="22" y="40" width="36" height="2" rx="1" className="fill-gray-500" />
        <rect x="22" y="46" width="28" height="2" rx="1" className="fill-gray-500" />
      </svg>
    ),
  },
  {
    id: "full-width",
    label: "Full Width",
    description: "ภาพปกเต็มจอ ตามด้วยเนื้อหาด้านล่าง ดูสะดุดตา",
    preview: (
      <svg viewBox="0 0 80 60" className="h-full w-full">
        <rect x="0" y="0" width="80" height="60" rx="4" className="fill-gray-800" />
        <rect x="0" y="0" width="80" height="32" className="fill-rose-500/40" />
        <rect x="6" y="22" width="36" height="3" rx="1.5" className="fill-white" />
        <rect x="14" y="40" width="52" height="2" rx="1" className="fill-gray-500" />
        <rect x="14" y="46" width="52" height="2" rx="1" className="fill-gray-500" />
        <rect x="14" y="52" width="32" height="2" rx="1" className="fill-gray-500" />
      </svg>
    ),
  },
  {
    id: "magazine",
    label: "Magazine",
    description: "สองคอลัมน์ มี sidebar แสดงข้อมูลและบทความที่เกี่ยวข้อง",
    preview: (
      <svg viewBox="0 0 80 60" className="h-full w-full">
        <rect x="0" y="0" width="80" height="60" rx="4" className="fill-gray-800" />
        <rect x="6" y="8" width="48" height="3" rx="1.5" className="fill-gray-500" />
        <rect x="6" y="16" width="48" height="20" rx="2" className="fill-gray-600" />
        <rect x="6" y="40" width="48" height="2" rx="1" className="fill-gray-500" />
        <rect x="6" y="46" width="48" height="2" rx="1" className="fill-gray-500" />
        <rect x="60" y="8" width="14" height="3" rx="1" className="fill-rose-400/60" />
        <rect x="60" y="14" width="14" height="14" rx="2" className="fill-gray-700" />
        <rect x="60" y="32" width="14" height="14" rx="2" className="fill-gray-700" />
      </svg>
    ),
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "เรียบง่าย ไม่มีภาพปก เน้นเนื้อหา ตัวอักษรเป็นหลัก",
    preview: (
      <svg viewBox="0 0 80 60" className="h-full w-full">
        <rect x="0" y="0" width="80" height="60" rx="4" className="fill-gray-800" />
        <rect x="26" y="12" width="28" height="3" rx="1.5" className="fill-gray-500" />
        <rect x="26" y="22" width="28" height="2" rx="1" className="fill-gray-500" />
        <rect x="26" y="28" width="28" height="2" rx="1" className="fill-gray-500" />
        <rect x="26" y="34" width="28" height="2" rx="1" className="fill-gray-500" />
        <rect x="26" y="40" width="20" height="2" rx="1" className="fill-gray-500" />
      </svg>
    ),
  },
];

function slugify(input: string): string {
  return input
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9฀-๿-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ArticleForm({
  initialValues,
  isCreating,
  isSaving,
  error,
  onCancel,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<ArticleFormValues>(initialValues);
  const [slugTouched, setSlugTouched] = useState(!isCreating);

  useEffect(() => {
    setValues(initialValues);
    setSlugTouched(!isCreating);
  }, [initialValues, isCreating]);

  const update = <K extends keyof ArticleFormValues>(
    field: K,
    value: ArticleFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleTitleChange = (v: string) => {
    update("title", v);
    if (!slugTouched) update("slug", slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values.contentBlocks.length === 0) {
      alert("กรุณาเพิ่มเนื้อหาอย่างน้อย 1 บล็อก");
      return;
    }
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {isCreating ? "เพิ่มบทความใหม่" : "แก้ไขบทความ"}
          </h2>
          {!isCreating && values.slug && (
            <p className="text-xs text-gray-500 mt-0.5">/articles/{values.slug}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:from-red-600 hover:to-red-700 disabled:opacity-60"
          >
            {isSaving ? "กำลังบันทึก..." : isCreating ? "สร้างบทความ" : "บันทึก"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* Title & Slug */}
        <section className="space-y-4">
          <Field label="หัวข้อบทความ" required>
            <input
              type="text"
              required
              value={values.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="เช่น 5 เทคนิคจัดเน็ตบ้านให้แรงทุกห้อง"
              className={inputClass + " text-base font-medium"}
            />
          </Field>

          <Field
            label="Slug (URL)"
            hint="ใช้ในลิงก์ /articles/your-slug — แก้ไขได้ตามต้องการ"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">/articles/</span>
              <input
                type="text"
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update("slug", e.target.value);
                }}
                placeholder="example-article-slug"
                className={inputClass + " flex-1"}
              />
              {isCreating && slugTouched && (
                <button
                  type="button"
                  onClick={() => {
                    update("slug", slugify(values.title));
                    setSlugTouched(false);
                  }}
                  className="text-xs text-red-400 hover:underline whitespace-nowrap"
                >
                  สร้างใหม่
                </button>
              )}
            </div>
          </Field>

          <Field label="คำโปรย (Excerpt)" hint="แสดงในการ์ดและ SEO description fallback">
            <textarea
              value={values.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              rows={3}
              placeholder="สรุปสั้น ๆ ของบทความนี้..."
              className={inputClass}
            />
          </Field>
        </section>

        {/* Cover & Meta */}
        <section className="space-y-4">
          <Field label="ภาพปก (URL)">
            <input
              type="url"
              value={values.coverImage}
              onChange={(e) => update("coverImage", e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
            {values.coverImage && (
              <div className="mt-3 relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-gray-800 bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={values.coverImage}
                  alt="cover preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="หมวดหมู่">
              <input
                type="text"
                value={values.category}
                onChange={(e) => update("category", e.target.value)}
                placeholder="เช่น ข่าวสาร, เคล็ดลับ"
                className={inputClass}
                list="article-categories"
              />
              <datalist id="article-categories">
                <option value="ข่าวสาร" />
                <option value="โปรโมชั่น" />
                <option value="เคล็ดลับ" />
                <option value="เทคโนโลยี" />
                <option value="บริการ" />
              </datalist>
            </Field>
            <Field label="ผู้เขียน">
              <input
                type="text"
                value={values.author}
                onChange={(e) => update("author", e.target.value)}
                placeholder="ชื่อผู้เขียน"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="แท็ก (Tags)" hint="คั่นด้วยจุลภาค เช่น wifi, internet, ทรู">
            <input
              type="text"
              value={values.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="tag1, tag2, tag3"
              className={inputClass}
            />
          </Field>
        </section>

        {/* Layout */}
        <section>
          <Field
            label="เลย์เอาต์การแสดงผล"
            hint="เลือกการจัดวางที่เหมาะกับเนื้อหาของคุณ"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
              {LAYOUTS.map((layout) => {
                const isSelected = values.layout === layout.id;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => update("layout", layout.id)}
                    className={`group relative flex flex-col rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-red-500 bg-red-500/5 ring-1 ring-red-500/40"
                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                    }`}
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-md mb-3">
                      {layout.preview}
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        isSelected ? "text-red-400" : "text-white"
                      }`}
                    >
                      {layout.label}
                    </span>
                    <span className="mt-1 text-[11px] leading-snug text-gray-500">
                      {layout.description}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Field>
        </section>

        {/* Content blocks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-300">
              เนื้อหา <span className="text-red-400">*</span>
            </label>
            <span className="text-xs text-gray-500">
              {values.contentBlocks.length} บล็อก
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            สร้างเนื้อหาด้วยการเพิ่มบล็อกทีละชิ้น — ไม่ต้องเขียนโค้ดใด ๆ
          </p>
          <BlockEditor
            blocks={values.contentBlocks}
            onChange={(blocks) => update("contentBlocks", blocks)}
          />
        </section>

        {/* Publish Settings */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">การเผยแพร่</h3>

            <Toggle
              label="เผยแพร่บทความ"
              hint="แสดงบนหน้า /articles ทันทีเมื่อเปิด"
              checked={values.isPublished}
              onChange={(v) => update("isPublished", v)}
            />
            <Toggle
              label="ตั้งเป็นบทความแนะนำ"
              hint="แสดงเป็น Featured ใหญ่ในหน้ารวมบทความ"
              checked={values.isFeatured}
              onChange={(v) => update("isFeatured", v)}
            />

            <Field label="วันที่เผยแพร่">
              <input
                type="datetime-local"
                value={values.publishedAt}
                onChange={(e) => update("publishedAt", e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="เวลาอ่าน (นาที)" hint="0 = คำนวณอัตโนมัติ">
                <input
                  type="number"
                  min={0}
                  value={values.readingTime}
                  onChange={(e) => update("readingTime", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="ลำดับการแสดง">
                <input
                  type="number"
                  value={values.displayOrder}
                  onChange={(e) => update("displayOrder", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">SEO</h3>

            <Field label="SEO Title" hint="หากเว้นว่าง จะใช้หัวข้อบทความ">
              <input
                type="text"
                value={values.seoTitle}
                onChange={(e) => update("seoTitle", e.target.value)}
                placeholder={values.title || "หัวข้อสำหรับเครื่องมือค้นหา"}
                className={inputClass}
              />
            </Field>

            <Field label="SEO Description" hint="แนะนำ 150-160 ตัวอักษร">
              <textarea
                value={values.seoDescription}
                onChange={(e) => update("seoDescription", e.target.value)}
                rows={4}
                placeholder={values.excerpt || "คำอธิบายสำหรับเครื่องมือค้นหา"}
                className={inputClass}
              />
              <div className="mt-1 flex justify-between text-[11px] text-gray-500">
                <span>ใช้แสดงใน Google และ social share</span>
                <span>{values.seoDescription.length} chars</span>
              </div>
            </Field>
          </div>
        </section>
      </div>
    </form>
  );
}

/* ───────── Small UI helpers ───────── */
const inputClass =
  "w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition ${
          checked ? "bg-red-500" : "bg-gray-700"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        {hint && <div className="text-xs text-gray-500 mt-0.5">{hint}</div>}
      </div>
    </label>
  );
}
