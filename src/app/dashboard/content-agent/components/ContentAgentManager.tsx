"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import type {
  ArticleAgentPayload,
  ContentAgentPackagePayload,
  ContentAgentScope,
  SiteContentAgentPayload,
} from "@/src/types/content-agent";
import {
  CONTENT_AGENT_MODEL_OPTIONS,
  ESTIMATED_USD_TO_THB,
  estimateContentAgentCost,
  getContentAgentModel,
} from "@/src/lib/content-agent-models";

type Settings = {
  id: string;
  enabled: boolean;
  autoPublish: boolean;
  sourceUrl: string;
  model: string;
  maxItems: number;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lockedUntil: string | null;
};

type Draft = {
  id: string;
  title: string;
  status: string;
  sourceUrl: string;
  imageUrl: string | null;
  externalKey: string;
  payload:
    | ContentAgentPackagePayload
    | SiteContentAgentPayload
    | ArticleAgentPayload;
  createdAt: string;
};

type Run = {
  id: string;
  trigger: string;
  status: string;
  discoveredCount: number;
  draftCount: number;
  publishedCount: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
};

type Workspace = {
  settings: Settings;
  drafts: Draft[];
  runs: Run[];
};

type Props = {
  promotion: Workspace;
  siteContent: Workspace;
  article: Workspace;
};

const scopeCopy = {
  promotion: {
    tab: "Promotion Agent",
    title: "จัดการแพ็กเกจและโปรโมชัน",
    description: "ตรวจราคา ความเร็ว สิทธิพิเศษ และภาพหัวการ์ดจากหน้าแพ็กเกจทรู",
    sourceLabel: "Source URL",
    activeLabel: "Active: ตรวจโปรใหม่อัตโนมัติทุกวัน",
    publishLabel: "Auto publish โปรที่ AI ตรวจพบ",
  },
  "site-content": {
    tab: "Site Content Agent",
    title: "จัดการเนื้อหาและภาพทั้งเว็บไซต์",
    description: "เสนอข้อความส่วนหน้า แคมเปญ และแบนเนอร์จากแหล่งข้อมูล true.th",
    sourceLabel: "Source URLs (หนึ่ง URL ต่อบรรทัด สูงสุด 6 หน้า)",
    activeLabel: "Active: ตรวจเนื้อหาและภาพอัตโนมัติทุกวัน",
    publishLabel: "Auto publish เนื้อหาและแบนเนอร์ที่ AI ตรวจพบ",
  },
  article: {
    tab: "Article Agent",
    title: "เขียนบทความ SEO และภาพประกอบ",
    description:
      "สร้างบทความภาษาไทยจากข้อมูลอ้างอิงจริง พร้อม SEO, internal links, CTA และตรวจความเกี่ยวข้องของภาพก่อนทำ draft",
    sourceLabel: "Source URLs (หนึ่ง URL ต่อบรรทัด สูงสุด 6 หน้า)",
    activeLabel: "Active: สร้างบทความใหม่อัตโนมัติทุกวัน",
    publishLabel: "Auto publish บทความที่ผ่านการตรวจอัตโนมัติ",
  },
} satisfies Record<
  ContentAgentScope,
  {
    tab: string;
    title: string;
    description: string;
    sourceLabel: string;
    activeLabel: string;
    publishLabel: string;
  }
>;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-gray-800 py-4 last:border-b-0">
      <span className="text-sm font-medium text-gray-200">{label}</span>
      <span className="relative inline-flex h-6 w-11 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-gray-700 transition-colors peer-checked:bg-red-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-red-500" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function isPromotionPayload(
  payload:
    | ContentAgentPackagePayload
    | SiteContentAgentPayload
    | ArticleAgentPayload
): payload is ContentAgentPackagePayload {
  return "speed" in payload;
}

function isArticlePayload(
  payload:
    | ContentAgentPackagePayload
    | SiteContentAgentPayload
    | ArticleAgentPayload
): payload is ArticleAgentPayload {
  return "sections" in payload && "seoTitle" in payload;
}

export default function ContentAgentManager({
  promotion,
  siteContent,
  article,
}: Props) {
  const router = useRouter();
  const [scope, setScope] = useState<ContentAgentScope>("promotion");
  const [promotionSettings, setPromotionSettings] = useState(promotion.settings);
  const [siteSettings, setSiteSettings] = useState(siteContent.settings);
  const [articleSettings, setArticleSettings] = useState(article.settings);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [draftActionId, setDraftActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPromotionSettings(promotion.settings), [promotion.settings]);
  useEffect(() => setSiteSettings(siteContent.settings), [siteContent.settings]);
  useEffect(() => setArticleSettings(article.settings), [article.settings]);

  const workspace =
    scope === "promotion"
      ? promotion
      : scope === "article"
        ? article
        : siteContent;
  const settings =
    scope === "promotion"
      ? promotionSettings
      : scope === "article"
        ? articleSettings
        : siteSettings;
  const setSettings =
    scope === "promotion"
      ? setPromotionSettings
      : scope === "article"
        ? setArticleSettings
        : setSiteSettings;
  const copy = scopeCopy[scope];
  const selectedModel = getContentAgentModel(settings.model);
  const costEstimate = estimateContentAgentCost({
    scope,
    model: settings.model,
    maxItems: settings.maxItems,
  });

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/content-agent/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, scope }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "บันทึกการตั้งค่าไม่สำเร็จ");

      setSettings(result);
      setMessage(`บันทึกการตั้งค่า ${copy.tab} แล้ว`);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "บันทึกการตั้งค่าไม่สำเร็จ"
      );
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    setRunning(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/content-agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || `${copy.tab} ทำงานไม่สำเร็จ`);
      }

      setMessage(
        `ตรวจพบ ${result.discoveredCount} รายการ สร้าง draft ${result.draftCount} รายการ และเผยแพร่ ${result.publishedCount} รายการ`
      );
      router.refresh();
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : `${copy.tab} ทำงานไม่สำเร็จ`
      );
    } finally {
      setRunning(false);
    }
  };

  const updateDraft = async (id: string, action: "approve" | "reject") => {
    setDraftActionId(id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/content-agent/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "อัปเดต draft ไม่สำเร็จ");

      setMessage(action === "approve" ? "เผยแพร่รายการแล้ว" : "ปฏิเสธ draft แล้ว");
      router.refresh();
    } catch (draftError) {
      setError(
        draftError instanceof Error ? draftError.message : "อัปเดต draft ไม่สำเร็จ"
      );
    } finally {
      setDraftActionId(null);
    }
  };

  const switchScope = (nextScope: ContentAgentScope) => {
    setScope(nextScope);
    setMessage(null);
    setError(null);
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="border-b border-gray-800 pb-6">
        <div className="flex items-center gap-2 text-red-400">
          <AutoAwesomeRoundedIcon fontSize="small" />
          <span className="text-xs font-semibold uppercase">AI Content Operations</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-white">AI จัดการข้อมูลเว็บไซต์</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
          แยกงานโปรโมชันออกจากเนื้อหาและภาพ เพื่อควบคุมแหล่งข้อมูล โหมดอัตโนมัติ
          และการอนุมัติได้อย่างอิสระ
        </p>

        <div className="mt-6 inline-flex rounded-lg border border-gray-800 bg-gray-950 p-1">
          {(Object.keys(scopeCopy) as ContentAgentScope[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchScope(item)}
              aria-pressed={scope === item}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                scope === item
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {scopeCopy[item].tab}
            </button>
          ))}
        </div>
      </header>

      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{copy.title}</h2>
          <p className="mt-1 text-sm text-gray-400">{copy.description}</p>
        </div>
        <button
          type="button"
          onClick={runNow}
          disabled={running}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlayArrowRoundedIcon fontSize="small" />
          {running ? "กำลังดึงข้อมูล..." : `สั่งรัน ${copy.tab}`}
        </button>
      </section>

      {message || error ? (
        <div
          className={`border px-4 py-3 text-sm ${
            error
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {error || message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <div className="border border-gray-800 bg-gray-900/40 p-5">
          <h3 className="mb-5 text-lg font-semibold text-white">การตั้งค่า</h3>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-gray-300">
                {copy.sourceLabel}
              </span>
              {scope === "site-content" || scope === "article" ? (
                <textarea
                  rows={4}
                  value={settings.sourceUrl}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      sourceUrl: event.target.value,
                    }))
                  }
                  className="w-full resize-y border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500"
                />
              ) : (
                <input
                  value={settings.sourceUrl}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      sourceUrl: event.target.value,
                    }))
                  }
                  className="w-full border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500"
                />
              )}
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-gray-300">
                OpenRouter model
              </span>
              <select
                value={settings.model}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    model: event.target.value,
                  }))
                }
                className="w-full border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500"
              >
                {CONTENT_AGENT_MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {selectedModel ? (
                <span className="mt-2 block text-xs leading-5 text-gray-500">
                  {selectedModel.description}
                </span>
              ) : null}
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-gray-300">
                จำนวนสูงสุดต่อรอบ
              </span>
              <input
                type="number"
                min={1}
                max={scope === "article" ? 6 : 30}
                value={settings.maxItems}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    maxItems: Number(event.target.value),
                  }))
                }
                className="w-full border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500"
              />
            </label>
          </div>

          <div className="mt-5 border-t border-gray-800">
            <Toggle
              checked={settings.enabled}
              onChange={(enabled) =>
                setSettings((current) => ({ ...current, enabled }))
              }
              label={copy.activeLabel}
            />
            <Toggle
              checked={settings.autoPublish}
              onChange={(autoPublish) =>
                setSettings((current) => ({ ...current, autoPublish }))
              }
              label={copy.publishLabel}
            />
          </div>

          {costEstimate && selectedModel ? (
            <div className="mt-5 border border-blue-500/30 bg-blue-500/5 p-4">
              <p className="text-sm font-semibold text-blue-300">
                ประมาณค่าใช้จ่าย
              </p>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">ต่อการรัน 1 ครั้ง</p>
                  <p className="mt-1 font-semibold text-gray-100">
                    ${costEstimate.usd.toFixed(4)} หรือประมาณ ฿
                    {costEstimate.thb.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">รันทุกวัน 30 ครั้ง</p>
                  <p className="mt-1 font-semibold text-gray-100">
                    ${costEstimate.monthlyUsd.toFixed(2)} หรือประมาณ ฿
                    {costEstimate.monthlyThb.toFixed(2)}/เดือน
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-500">
                คำนวณจาก input ราว {costEstimate.inputTokens.toLocaleString()} tokens,
                output ราว {costEstimate.outputTokens.toLocaleString()} tokens และอัตรา
                $1 ≈ ฿{ESTIMATED_USD_TO_THB} ค่าใช้จริงขึ้นกับขนาดหน้าเว็บและจำนวนรายการ
              </p>
            </div>
          ) : null}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-white disabled:opacity-50"
            >
              <SaveRoundedIcon fontSize="small" />
              {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
            </button>
          </div>
        </div>

        <dl className="divide-y divide-gray-800 border border-gray-800 bg-gray-900/40 px-5">
          <div className="py-4">
            <dt className="text-xs text-gray-500">สถานะอัตโนมัติ</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-200">
              {settings.enabled ? "Active" : "Inactive"}
            </dd>
          </div>
          <div className="py-4">
            <dt className="text-xs text-gray-500">รันล่าสุด</dt>
            <dd className="mt-1 text-sm font-medium text-gray-200">
              {formatDate(settings.lastRunAt)}
            </dd>
          </div>
          <div className="py-4">
            <dt className="text-xs text-gray-500">สำเร็จล่าสุด</dt>
            <dd className="mt-1 text-sm font-medium text-gray-200">
              {formatDate(settings.lastSuccessAt)}
            </dd>
          </div>
          {settings.lastError ? (
            <div className="py-4">
              <dt className="text-xs text-red-400">Error ล่าสุด</dt>
              <dd className="mt-1 break-words text-sm text-red-300">
                {settings.lastError}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">Draft รอตรวจ</h3>
          <span className="text-sm text-gray-500">{workspace.drafts.length} รายการ</span>
        </div>

        {workspace.drafts.length === 0 ? (
          <div className="border border-dashed border-gray-700 px-5 py-12 text-center text-sm text-gray-500">
            ไม่มี draft รอตรวจ
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {workspace.drafts.map((draft) => {
              const payload = draft.payload;
              return (
                <article
                  key={draft.id}
                  className="overflow-hidden border border-gray-800 bg-gray-900/40"
                >
                  {draft.imageUrl ? (
                    <div className="relative aspect-[3/1] w-full border-b border-gray-800 bg-gray-950">
                      <Image
                        src={draft.imageUrl}
                        alt={draft.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                  ) : null}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-blue-400">
                          {isPromotionPayload(payload)
                            ? payload.type
                            : isArticlePayload(payload)
                              ? `${payload.category} / SEO Article`
                              : `${payload.targetType}${payload.targetKey ? ` / ${payload.targetKey}` : ""}`}
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-white">
                          {draft.title}
                        </h4>
                      </div>
                      <a
                        href={draft.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="เปิดแหล่งข้อมูล"
                        className="text-gray-500 hover:text-white"
                      >
                        <OpenInNewRoundedIcon fontSize="small" />
                      </a>
                    </div>

                    {isPromotionPayload(payload) ? (
                      <>
                        <div className="mt-4 grid grid-cols-3 gap-3 border-y border-gray-800 py-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Speed</p>
                            <p className="mt-1 font-semibold text-gray-100">
                              {payload.speed} Mbps
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Price</p>
                            <p className="mt-1 font-semibold text-gray-100">
                              ฿{payload.price}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Contract</p>
                            <p className="mt-1 font-semibold text-gray-100">
                              {payload.contractMonths
                                ? `${payload.contractMonths} เดือน`
                                : "-"}
                            </p>
                          </div>
                        </div>
                        <ul className="mt-4 space-y-1.5 text-sm text-gray-400">
                          {payload.benefits.slice(0, 5).map((benefit) => (
                            <li key={benefit.label}>• {benefit.label}</li>
                          ))}
                        </ul>
                      </>
                    ) : isArticlePayload(payload) ? (
                      <div className="mt-4 space-y-3 border-y border-gray-800 py-4 text-sm text-gray-400">
                        <p>
                          <strong className="text-gray-200">SEO title:</strong>{" "}
                          {payload.seoTitle}
                        </p>
                        <p>
                          <strong className="text-gray-200">Keyword:</strong>{" "}
                          {payload.primaryKeyword}
                        </p>
                        <p>
                          <strong className="text-gray-200">Description:</strong>{" "}
                          {payload.seoDescription}
                        </p>
                        <p>
                          <strong className="text-gray-200">Sections:</strong>{" "}
                          {payload.sections.length}
                        </p>
                        <p>
                          <strong className="text-gray-200">Image confidence:</strong>{" "}
                          {Math.round(payload.imageConfidence * 100)}%
                          {payload.imageMatchReason
                            ? ` - ${payload.imageMatchReason}`
                            : " - ไม่ใช้รูปเมื่อหลักฐานไม่พอ"}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2 border-y border-gray-800 py-4 text-sm text-gray-400">
                        {payload.title ? <p><strong className="text-gray-200">Title:</strong> {payload.title}</p> : null}
                        {payload.subtitle ? <p><strong className="text-gray-200">Subtitle:</strong> {payload.subtitle}</p> : null}
                        {payload.description ? <p><strong className="text-gray-200">Description:</strong> {payload.description}</p> : null}
                        <p>
                          <strong className="text-gray-200">Image confidence:</strong>{" "}
                          {Math.round(payload.imageConfidence * 100)}%
                          {payload.imageMatchReason
                            ? ` - ${payload.imageMatchReason}`
                            : " - ไม่ใช้รูปเมื่อหลักฐานไม่พอ"}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => updateDraft(draft.id, "approve")}
                        disabled={draftActionId === draft.id}
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <CheckRoundedIcon fontSize="small" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDraft(draft.id, "reject")}
                        disabled={draftActionId === draft.id}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:border-red-500 hover:text-red-300 disabled:opacity-50"
                      >
                        <CloseRoundedIcon fontSize="small" />
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-5 text-lg font-semibold text-white">Run history</h3>
        <div className="overflow-x-auto border border-gray-800">
          <table className="min-w-full divide-y divide-gray-800 text-left text-sm">
            <thead className="bg-gray-900">
              <tr className="text-xs uppercase text-gray-500">
                <th className="px-4 py-3 font-medium">เวลา</th>
                <th className="px-4 py-3 font-medium">Trigger</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Found</th>
                <th className="px-4 py-3 font-medium">Draft</th>
                <th className="px-4 py-3 font-medium">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950/40">
              {workspace.runs.map((run) => (
                <tr key={run.id} className="text-gray-300">
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatDate(run.startedAt)}
                  </td>
                  <td className="px-4 py-3">{run.trigger}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        run.status === "SUCCEEDED"
                          ? "text-emerald-400"
                          : run.status === "FAILED"
                            ? "text-red-400"
                            : "text-amber-400"
                      }
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{run.discoveredCount}</td>
                  <td className="px-4 py-3">{run.draftCount}</td>
                  <td className="px-4 py-3">{run.publishedCount}</td>
                </tr>
              ))}
              {workspace.runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    ยังไม่มีประวัติการรัน
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
