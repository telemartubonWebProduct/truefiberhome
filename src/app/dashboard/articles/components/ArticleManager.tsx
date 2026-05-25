"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ArticleForm, { type ArticleFormValues } from "./ArticleForm";
import { normalizeBlocks, type Block } from "@/src/lib/article-blocks";

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  contentBlocks: any;
  coverImage: string | null;
  category: string | null;
  tags: any;
  layout: string;
  author: string | null;
  readingTime: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  displayOrder: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialArticles: Article[];
}

const LAYOUT_LABELS: Record<string, string> = {
  default: "Default",
  "full-width": "Full Width",
  magazine: "Magazine",
  minimal: "Minimal",
};

function tagsToString(value: unknown): string {
  if (Array.isArray(value)) {
    return value.filter((t) => typeof t === "string").join(", ");
  }
  return "";
}

function htmlToBlocks(html: string): Block[] {
  if (!html || !html.trim()) return [];
  const stripped = html
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

  const paragraphs = stripped
    .split(/\n{2,}|\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return paragraphs.map((text, i) => ({
    id: `b_legacy_${Date.now().toString(36)}_${i}`,
    type: "paragraph" as const,
    text,
  }));
}

function articleToForm(article: Article): ArticleFormValues {
  const fromBlocks = normalizeBlocks(article.contentBlocks);
  const blocks =
    fromBlocks.length > 0 ? fromBlocks : htmlToBlocks(article.content);

  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || "",
    contentBlocks: blocks,
    coverImage: article.coverImage || "",
    category: article.category || "",
    tags: tagsToString(article.tags),
    layout: article.layout || "default",
    author: article.author || "",
    readingTime: article.readingTime || 0,
    isPublished: article.isPublished,
    isFeatured: article.isFeatured,
    publishedAt: article.publishedAt
      ? new Date(article.publishedAt).toISOString().slice(0, 16)
      : "",
    seoTitle: article.seoTitle || "",
    seoDescription: article.seoDescription || "",
    displayOrder: article.displayOrder,
  };
}

const EMPTY_FORM: ArticleFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  contentBlocks: [],
  coverImage: "",
  category: "",
  tags: "",
  layout: "default",
  author: "",
  readingTime: 0,
  isPublished: false,
  isFeatured: false,
  publishedAt: "",
  seoTitle: "",
  seoDescription: "",
  displayOrder: 0,
};

export default function ArticleManager({ initialArticles }: Props) {
  const router = useRouter();
  const [articles, setArticles] = useState(initialArticles);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">(
    "all"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = useMemo(
    () => (editingId ? articles.find((a) => a.id === editingId) || null : null),
    [editingId, articles]
  );

  const formInitial: ArticleFormValues | null = isCreating
    ? EMPTY_FORM
    : editing
      ? articleToForm(editing)
      : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (statusFilter === "published" && !a.isPublished) return false;
      if (statusFilter === "draft" && a.isPublished) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        (a.category || "").toLowerCase().includes(q)
      );
    });
  }, [articles, search, statusFilter]);

  const closeForm = () => {
    setEditingId(null);
    setIsCreating(false);
    setError(null);
  };

  const handleSubmit = async (values: ArticleFormValues) => {
    setIsSaving(true);
    setError(null);
    try {
      const endpoint = isCreating
        ? "/api/articles"
        : `/api/articles/${editingId}`;
      const method = isCreating ? "POST" : "PUT";

      const { contentBlocks, ...rest } = values;
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          contentBlocks,
          tags: values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const base = j.error || "บันทึกไม่สำเร็จ";
        throw new Error(j.detail ? `${base} — ${j.detail}` : base);
      }

      const saved: Article = await res.json();

      setArticles((prev) => {
        if (isCreating) return [saved, ...prev];
        return prev.map((a) => (a.id === saved.id ? saved : a));
      });

      closeForm();
      router.refresh();
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบบทความนี้หรือไม่?")) return;
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setArticles((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  };

  const handleQuickToggle = async (
    article: Article,
    field: "isPublished" | "isFeatured"
  ) => {
    const newValue = !article[field];
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      });
      if (!res.ok) throw new Error();
      const updated: Article = await res.json();
      setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      router.refresh();
    } catch {
      alert("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาบทความ..."
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "published", "draft"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                  statusFilter === s
                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                    : "bg-gray-900 text-gray-400 border border-gray-700 hover:text-white"
                }`}
              >
                {s === "all" ? "ทั้งหมด" : s === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:from-red-600 hover:to-red-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มบทความใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="ทั้งหมด" value={articles.length} />
        <StatCard label="เผยแพร่แล้ว" value={articles.filter((a) => a.isPublished).length} />
        <StatCard label="ฉบับร่าง" value={articles.filter((a) => !a.isPublished).length} />
        <StatCard label="แนะนำ" value={articles.filter((a) => a.isFeatured).length} />
      </div>

      {/* Article list */}
      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-gray-500">ยังไม่มีบทความที่ตรงกัน</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {filtered.map((article) => (
              <li
                key={article.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 hover:bg-gray-800/40 transition"
              >
                <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800">
                  {article.coverImage ? (
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-600">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {article.isFeatured && (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                        ★ แนะนำ
                      </span>
                    )}
                    {article.isPublished ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                        เผยแพร่
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-700/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border border-gray-700">
                        ฉบับร่าง
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300 border border-indigo-500/20">
                      {LAYOUT_LABELS[article.layout] || article.layout}
                    </span>
                    {article.category && (
                      <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300 border border-rose-500/20">
                        {article.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold truncate">{article.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    /{article.slug}
                    {article.author ? ` · ${article.author}` : ""}
                    {article.readingTime ? ` · ${article.readingTime} นาที` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleQuickToggle(article, "isPublished")}
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-emerald-500/40 hover:text-emerald-400 transition"
                    title={article.isPublished ? "ยกเลิกเผยแพร่" : "เผยแพร่"}
                  >
                    {article.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => handleQuickToggle(article, "isFeatured")}
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-amber-500/40 hover:text-amber-400 transition"
                  >
                    {article.isFeatured ? "Unstar" : "Star"}
                  </button>
                  <Link
                    href={`/articles/${article.slug}`}
                    target="_blank"
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-blue-500/40 hover:text-blue-400 transition"
                  >
                    ดู
                  </Link>
                  <button
                    onClick={() => {
                      setEditingId(article.id);
                      setIsCreating(false);
                    }}
                    className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-400 hover:border-red-500/40 hover:text-red-400 transition"
                  >
                    ลบ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Form Drawer */}
      {formInitial && (
        <FormDrawer onClose={closeForm}>
          <ArticleForm
            initialValues={formInitial}
            isCreating={isCreating}
            isSaving={isSaving}
            error={error}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        </FormDrawer>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function FormDrawer({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="w-full max-w-3xl bg-gray-950 border-l border-gray-800 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
