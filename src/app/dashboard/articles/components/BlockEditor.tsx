"use client";

import { useState } from "react";
import type { Block, BlockType } from "@/src/lib/article-blocks";

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

const PALETTE: Array<{
  type: BlockType;
  label: string;
  description: string;
  icon: string;
}> = [
  { type: "heading", label: "หัวข้อใหญ่", description: "H2 — หัวข้อหลักของแต่ละหัวข้อ", icon: "H₁" },
  { type: "subheading", label: "หัวข้อรอง", description: "H3 — หัวข้อย่อยภายใต้หัวข้อหลัก", icon: "H₂" },
  { type: "paragraph", label: "ย่อหน้า", description: "ข้อความปกติ รองรับ **ตัวหนา** *ตัวเอียง* [ลิงก์](url)", icon: "¶" },
  { type: "image", label: "รูปภาพ", description: "เพิ่มรูป + คำบรรยายใต้ภาพ", icon: "🖼" },
  { type: "quote", label: "คำคม", description: "ข้อความเด่น หรือคำพูดผู้เชี่ยวชาญ", icon: "❝" },
  { type: "list", label: "รายการ", description: "Bullet หรือ Numbered list", icon: "≔" },
  { type: "callout", label: "กล่องเคล็ดลับ", description: "กล่องเตือน/ทิป/ข้อมูลเสริม สีสันโดดเด่น", icon: "💡" },
  { type: "button", label: "ปุ่มกด (CTA)", description: "ปุ่มเรียกลูกค้าให้กดเพื่อทำสิ่งใดสิ่งหนึ่ง", icon: "⬢" },
  { type: "divider", label: "เส้นคั่น", description: "เส้นแบ่งระหว่างหัวข้อ", icon: "—" },
];

function newId(): string {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case "heading":
      return { id, type, text: "หัวข้อใหม่" };
    case "subheading":
      return { id, type, text: "หัวข้อรอง" };
    case "paragraph":
      return { id, type, text: "เริ่มเขียนเนื้อหาที่นี่..." };
    case "image":
      return { id, type, src: "", alt: "", caption: "" };
    case "quote":
      return { id, type, text: "ใส่คำคมหรือคำพูดที่น่าสนใจ", author: "" };
    case "list":
      return { id, type, ordered: false, items: ["รายการที่ 1", "รายการที่ 2"] };
    case "callout":
      return { id, type, variant: "tip", title: "เคล็ดลับ", text: "ข้อความสำหรับกล่องเคล็ดลับ" };
    case "button":
      return { id, type, label: "กดเพื่อสมัคร", href: "https://", variant: "primary" };
    case "divider":
      return { id, type };
  }
}

export default function BlockEditor({ blocks, onChange }: Props) {
  const [showPaletteAt, setShowPaletteAt] = useState<number | null>(null);

  const addBlock = (type: BlockType, atIndex: number) => {
    const newBlock = createBlock(type);
    const next = [...blocks];
    next.splice(atIndex, 0, newBlock);
    onChange(next);
    setShowPaletteAt(null);
  };

  const updateBlock = (idx: number, patch: Partial<Block>) => {
    const next = blocks.map((b, i) =>
      i === idx ? ({ ...b, ...patch } as Block) : b
    );
    onChange(next);
  };

  const removeBlock = (idx: number) => {
    onChange(blocks.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/50 p-10 text-center">
          <p className="text-3xl mb-3">✨</p>
          <h3 className="text-white font-semibold mb-1">ยังไม่มีเนื้อหา</h3>
          <p className="text-sm text-gray-500 mb-5">
            เริ่มสร้างบทความของคุณด้วยการเพิ่มบล็อกแรก
          </p>
          <button
            type="button"
            onClick={() => setShowPaletteAt(0)}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            + เพิ่มบล็อกแรก
          </button>
          {showPaletteAt === 0 && (
            <Palette onPick={(type) => addBlock(type, 0)} onClose={() => setShowPaletteAt(null)} />
          )}
        </div>
      )}

      {blocks.map((block, idx) => (
        <div key={block.id}>
          <AddBlockBetween
            isOpen={showPaletteAt === idx}
            onOpen={() => setShowPaletteAt(idx)}
            onClose={() => setShowPaletteAt(null)}
            onPick={(type) => addBlock(type, idx)}
          />

          <BlockCard
            block={block}
            index={idx}
            total={blocks.length}
            onChange={(patch) => updateBlock(idx, patch)}
            onRemove={() => removeBlock(idx)}
            onMove={(dir) => moveBlock(idx, dir)}
          />
        </div>
      ))}

      {blocks.length > 0 && (
        <AddBlockBetween
          isOpen={showPaletteAt === blocks.length}
          onOpen={() => setShowPaletteAt(blocks.length)}
          onClose={() => setShowPaletteAt(null)}
          onPick={(type) => addBlock(type, blocks.length)}
        />
      )}
    </div>
  );
}

/* ───────── Add Block Between Slot ───────── */

function AddBlockBetween({
  isOpen,
  onOpen,
  onClose,
  onPick,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPick: (type: BlockType) => void;
}) {
  return (
    <div className="relative py-1">
      <div className="group flex items-center justify-center">
        <button
          type="button"
          onClick={isOpen ? onClose : onOpen}
          className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-medium transition ${
            isOpen
              ? "border-red-500 bg-red-500/10 text-red-400"
              : "border-dashed border-gray-700 bg-gray-900 text-gray-500 hover:border-red-500/50 hover:text-red-400"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มบล็อก
        </button>
      </div>
      {isOpen && <Palette onPick={onPick} onClose={onClose} />}
    </div>
  );
}

/* ───────── Block Type Palette ───────── */

function Palette({
  onPick,
  onClose,
}: {
  onPick: (type: BlockType) => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-2 relative">
      <button
        type="button"
        onClick={onClose}
        className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-white text-xs hover:bg-gray-600"
        aria-label="ปิด"
      >
        ✕
      </button>
      <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur p-4 shadow-xl">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
          เลือกประเภทบล็อก
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PALETTE.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onPick(item.type)}
              className="group flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950 p-3 text-left transition hover:border-red-500/40 hover:bg-red-500/5"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-800 text-base group-hover:bg-red-500/20">
                {item.icon}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">{item.label}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-gray-500 group-hover:text-gray-400">
                  {item.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── Block Card (controls + form) ───────── */

function BlockCard({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  block: Block;
  index: number;
  total: number;
  onChange: (patch: Partial<Block>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const meta = PALETTE.find((p) => p.type === block.type);
  return (
    <div className="group relative rounded-2xl border border-gray-800 bg-gray-900 transition hover:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-800 text-sm">
            {meta?.icon}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {meta?.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => onMove(-1)}
            disabled={index === 0}
            title="เลื่อนขึ้น"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </IconButton>
          <IconButton
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            title="เลื่อนลง"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </IconButton>
          <IconButton onClick={onRemove} title="ลบ" danger>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <BlockForm block={block} onChange={onChange} />
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? "hover:bg-red-500/15 hover:text-red-400"
          : "hover:bg-gray-800 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/* ───────── Block-specific forms ───────── */

const inp =
  "w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

function BlockForm({
  block,
  onChange,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <input
          type="text"
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value } as any)}
          placeholder="หัวข้อใหญ่..."
          className={inp + " text-lg font-semibold"}
        />
      );

    case "subheading":
      return (
        <input
          type="text"
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value } as any)}
          placeholder="หัวข้อรอง..."
          className={inp + " text-base font-medium"}
        />
      );

    case "paragraph":
      return (
        <div>
          <textarea
            value={block.text}
            onChange={(e) => onChange({ text: e.target.value } as any)}
            rows={5}
            placeholder="พิมพ์เนื้อหา..."
            className={inp + " leading-relaxed"}
          />
          <p className="mt-1.5 text-[11px] text-gray-500">
            💡 ใส่ <code className="text-rose-400">**ข้อความ**</code> เพื่อทำตัวหนา ·{" "}
            <code className="text-rose-400">*ข้อความ*</code> ทำตัวเอียง ·{" "}
            <code className="text-rose-400">[ลิงก์](https://...)</code> ทำลิงก์
          </p>
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          <div>
            <Label>URL รูปภาพ</Label>
            <input
              type="url"
              value={block.src}
              onChange={(e) => onChange({ src: e.target.value } as any)}
              placeholder="https://example.com/image.jpg"
              className={inp}
            />
          </div>
          {block.src && (
            <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-gray-800 bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.src} alt={block.alt} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>คำอธิบายภาพ (Alt text)</Label>
              <input
                type="text"
                value={block.alt}
                onChange={(e) => onChange({ alt: e.target.value } as any)}
                placeholder="ภาพอะไร? (สำคัญสำหรับ SEO)"
                className={inp}
              />
            </div>
            <div>
              <Label>คำบรรยายใต้ภาพ (ถ้าต้องการ)</Label>
              <input
                type="text"
                value={block.caption || ""}
                onChange={(e) => onChange({ caption: e.target.value } as any)}
                placeholder="ภาพประกอบจาก..."
                className={inp}
              />
            </div>
          </div>
        </div>
      );

    case "quote":
      return (
        <div className="space-y-3">
          <div>
            <Label>คำคม / คำพูด</Label>
            <textarea
              value={block.text}
              onChange={(e) => onChange({ text: e.target.value } as any)}
              rows={3}
              placeholder="ข้อความที่ต้องการเน้น..."
              className={inp + " italic"}
            />
          </div>
          <div>
            <Label>แหล่งที่มา / ผู้พูด (ถ้ามี)</Label>
            <input
              type="text"
              value={block.author || ""}
              onChange={(e) => onChange({ author: e.target.value } as any)}
              placeholder="เช่น อาจารย์สมหมาย"
              className={inp}
            />
          </div>
        </div>
      );

    case "list":
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ ordered: false } as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                !block.ordered
                  ? "bg-red-500/10 text-red-400 border border-red-500/30"
                  : "bg-gray-950 text-gray-400 border border-gray-700 hover:text-white"
              }`}
            >
              • Bullet
            </button>
            <button
              type="button"
              onClick={() => onChange({ ordered: true } as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                block.ordered
                  ? "bg-red-500/10 text-red-400 border border-red-500/30"
                  : "bg-gray-950 text-gray-400 border border-gray-700 hover:text-white"
              }`}
            >
              1. Numbered
            </button>
          </div>
          <div className="space-y-2">
            {block.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-gray-500 text-sm w-5 text-right">
                  {block.ordered ? `${i + 1}.` : "•"}
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...block.items];
                    next[i] = e.target.value;
                    onChange({ items: next } as any);
                  }}
                  placeholder={`รายการที่ ${i + 1}`}
                  className={inp}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = block.items.filter((_, j) => j !== i);
                    onChange({ items: next.length > 0 ? next : [""] } as any);
                  }}
                  className="text-gray-500 hover:text-red-400 px-2"
                  title="ลบรายการ"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChange({ items: [...block.items, ""] } as any)}
              className="text-xs text-red-400 hover:underline ml-7"
            >
              + เพิ่มรายการ
            </button>
          </div>
        </div>
      );

    case "callout":
      return (
        <div className="space-y-3">
          <div>
            <Label>ประเภท</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { v: "tip", label: "💡 เคล็ดลับ", color: "amber" },
                  { v: "warning", label: "⚠️ เตือน", color: "red" },
                  { v: "info", label: "ℹ️ ข้อมูล", color: "blue" },
                  { v: "success", label: "✅ สำเร็จ", color: "green" },
                ] as const
              ).map((v) => (
                <button
                  key={v.v}
                  type="button"
                  onClick={() => onChange({ variant: v.v } as any)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    block.variant === v.v
                      ? "bg-red-500/10 text-red-400 border border-red-500/30"
                      : "bg-gray-950 text-gray-400 border border-gray-700 hover:text-white"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>หัวข้อ (ถ้ามี)</Label>
            <input
              type="text"
              value={block.title || ""}
              onChange={(e) => onChange({ title: e.target.value } as any)}
              placeholder="เช่น รู้หรือไม่?"
              className={inp}
            />
          </div>
          <div>
            <Label>เนื้อหา</Label>
            <textarea
              value={block.text}
              onChange={(e) => onChange({ text: e.target.value } as any)}
              rows={3}
              placeholder="ข้อความสำหรับกล่องเคล็ดลับ..."
              className={inp}
            />
          </div>
        </div>
      );

    case "button":
      return (
        <div className="space-y-3">
          <div>
            <Label>สไตล์ปุ่ม</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ variant: "primary" } as any)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  block.variant === "primary"
                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                    : "bg-gray-950 text-gray-400 border border-gray-700 hover:text-white"
                }`}
              >
                🔴 ปุ่มหลัก (สีแดง)
              </button>
              <button
                type="button"
                onClick={() => onChange({ variant: "secondary" } as any)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  block.variant === "secondary"
                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                    : "bg-gray-950 text-gray-400 border border-gray-700 hover:text-white"
                }`}
              >
                ⚪ ปุ่มรอง (สีขาว)
              </button>
            </div>
          </div>
          <div>
            <Label>ข้อความบนปุ่ม</Label>
            <input
              type="text"
              value={block.label}
              onChange={(e) => onChange({ label: e.target.value } as any)}
              placeholder="เช่น สมัครเลยวันนี้"
              className={inp}
            />
          </div>
          <div>
            <Label>ลิงก์ปลายทาง (URL)</Label>
            <input
              type="url"
              value={block.href}
              onChange={(e) => onChange({ href: e.target.value } as any)}
              placeholder="https://lin.ee/..."
              className={inp}
            />
          </div>
        </div>
      );

    case "divider":
      return (
        <div className="flex items-center justify-center py-2">
          <div className="h-px w-full bg-gray-700" />
        </div>
      );

    default:
      return null;
  }
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-medium text-gray-400">
      {children}
    </label>
  );
}
