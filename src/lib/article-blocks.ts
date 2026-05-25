/**
 * Article block system — structured content blocks that are converted to HTML.
 * Admins compose articles from these blocks via a visual editor; the rendered
 * HTML is stored in `Article.content` and the raw blocks in `Article.contentBlocks`.
 */

export type BlockType =
  | "heading"
  | "subheading"
  | "paragraph"
  | "image"
  | "quote"
  | "list"
  | "callout"
  | "button"
  | "divider";

export interface BlockBase {
  id: string;
  type: BlockType;
}

export interface HeadingBlock extends BlockBase {
  type: "heading";
  text: string;
}
export interface SubheadingBlock extends BlockBase {
  type: "subheading";
  text: string;
}
export interface ParagraphBlock extends BlockBase {
  type: "paragraph";
  text: string;
}
export interface ImageBlock extends BlockBase {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
}
export interface QuoteBlock extends BlockBase {
  type: "quote";
  text: string;
  author?: string;
}
export interface ListBlock extends BlockBase {
  type: "list";
  ordered: boolean;
  items: string[];
}
export interface CalloutBlock extends BlockBase {
  type: "callout";
  variant: "tip" | "warning" | "info" | "success";
  title?: string;
  text: string;
}
export interface ButtonBlock extends BlockBase {
  type: "button";
  label: string;
  href: string;
  variant: "primary" | "secondary";
}
export interface DividerBlock extends BlockBase {
  type: "divider";
}

export type Block =
  | HeadingBlock
  | SubheadingBlock
  | ParagraphBlock
  | ImageBlock
  | QuoteBlock
  | ListBlock
  | CalloutBlock
  | ButtonBlock
  | DividerBlock;

/* ───────── HTML escape helpers ───────── */

function escapeHtml(input: string): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(input: string): string {
  return escapeHtml(input);
}

/**
 * Convert inline simple markup to safe HTML:
 *   **bold**  →  <strong>bold</strong>
 *   *italic*  →  <em>italic</em>
 *   [text](url) → <a href="url" target="_blank" rel="noopener">text</a>
 * Newlines become <br/>.
 * All other HTML is escaped.
 */
function renderInline(input: string): string {
  const escaped = escapeHtml(input);
  const withLinks = escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label: string, raw: string) => {
      const href = String(raw).trim();
      if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(href)) {
        return label;
      }
      const isExternal = /^https?:\/\//i.test(href);
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escapeAttr(href)}"${target}>${label}</a>`;
    }
  );
  const withBold = withLinks.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const withItalic = withBold.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return withItalic.replace(/\n/g, "<br/>");
}

function safeUrl(input: string): string | null {
  const v = String(input ?? "").trim();
  if (!v) return null;
  if (/^javascript:/i.test(v)) return null;
  if (/^data:/i.test(v) && !/^data:image\//i.test(v)) return null;
  if (
    /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(v) ||
    /^data:image\//i.test(v)
  ) {
    return v;
  }
  return null;
}

/* ───────── Block → HTML ───────── */

export function blockToHtml(block: Block): string {
  switch (block.type) {
    case "heading":
      return `<h2>${renderInline(block.text || "")}</h2>`;

    case "subheading":
      return `<h3>${renderInline(block.text || "")}</h3>`;

    case "paragraph":
      return `<p>${renderInline(block.text || "")}</p>`;

    case "image": {
      const src = safeUrl(block.src);
      if (!src) return "";
      const alt = escapeAttr(block.alt || "");
      const caption = block.caption?.trim();
      if (caption) {
        return `<figure><img src="${escapeAttr(src)}" alt="${alt}" loading="lazy"/><figcaption>${renderInline(caption)}</figcaption></figure>`;
      }
      return `<img src="${escapeAttr(src)}" alt="${alt}" loading="lazy"/>`;
    }

    case "quote": {
      const author = block.author?.trim();
      const cite = author
        ? `<cite style="display:block;margin-top:0.5em;font-style:normal;font-size:0.875em;color:#6b7280;">— ${renderInline(author)}</cite>`
        : "";
      return `<blockquote>${renderInline(block.text || "")}${cite}</blockquote>`;
    }

    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = (block.items || [])
        .filter((i) => i && i.trim())
        .map((i) => `<li>${renderInline(i)}</li>`)
        .join("");
      return `<${tag}>${items}</${tag}>`;
    }

    case "callout": {
      const palette: Record<string, { bg: string; border: string; icon: string }> = {
        tip: { bg: "#fff7ed", border: "#fb923c", icon: "💡" },
        warning: { bg: "#fef2f2", border: "#f87171", icon: "⚠️" },
        info: { bg: "#eff6ff", border: "#60a5fa", icon: "ℹ️" },
        success: { bg: "#f0fdf4", border: "#4ade80", icon: "✅" },
      };
      const p = palette[block.variant] || palette.info;
      const title = block.title?.trim()
        ? `<div style="font-weight:600;margin-bottom:0.35em;">${p.icon} ${renderInline(block.title)}</div>`
        : "";
      return `<div class="article-callout" style="background:${p.bg};border-left:4px solid ${p.border};padding:1.1em 1.25em;border-radius:0.75rem;margin:1.5em 0;">${title}<div>${renderInline(block.text || "")}</div></div>`;
    }

    case "button": {
      const href = safeUrl(block.href);
      if (!href || !block.label?.trim()) return "";
      const variant = block.variant === "secondary" ? "secondary" : "primary";
      const styles =
        variant === "primary"
          ? "background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;"
          : "background:#fff;color:#111827;border:1px solid #e5e7eb;";
      return `<p style="text-align:center;margin:2em 0;"><a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:0.85em 2em;border-radius:9999px;font-weight:600;text-decoration:none;${styles}box-shadow:0 10px 25px -10px rgba(239,68,68,0.4);">${renderInline(block.label)}</a></p>`;
    }

    case "divider":
      return `<hr/>`;

    default:
      return "";
  }
}

export function blocksToHtml(blocks: Block[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return "";
  return blocks
    .map(blockToHtml)
    .filter(Boolean)
    .join("\n");
}

export function blocksToPlainText(blocks: Block[]): string {
  if (!Array.isArray(blocks)) return "";
  const out: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "heading":
      case "subheading":
      case "paragraph":
        out.push(b.text || "");
        break;
      case "quote":
        out.push(b.text || "");
        if (b.author) out.push(b.author);
        break;
      case "list":
        out.push(...(b.items || []));
        break;
      case "callout":
        if (b.title) out.push(b.title);
        out.push(b.text || "");
        break;
      case "button":
        out.push(b.label || "");
        break;
      case "image":
        if (b.caption) out.push(b.caption);
        break;
    }
  }
  return out.join(" ");
}

export function estimateReadingTimeFromBlocks(blocks: Block[]): number {
  const text = blocksToPlainText(blocks);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/* ───────── Validation ───────── */

export function isValidBlock(value: unknown): value is Block {
  if (!value || typeof value !== "object") return false;
  const v = value as any;
  const validTypes: BlockType[] = [
    "heading",
    "subheading",
    "paragraph",
    "image",
    "quote",
    "list",
    "callout",
    "button",
    "divider",
  ];
  return typeof v.id === "string" && validTypes.includes(v.type);
}

export function normalizeBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isValidBlock);
}
