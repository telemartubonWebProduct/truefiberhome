import type { ChatMessageDto } from "@/src/types/chat";

interface ChatBubbleProps {
  message: ChatMessageDto;
}

type BubbleLink = {
  url: string;
  label: string;
};

function formatClock(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeMessageText(content: string, hasLinks: boolean) {
  let normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    .replace(/https?:\/\/[^\s)]+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/\s\*\s+/g, "\n- ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

  if (hasLinks) {
    normalized = normalized
      .replace(/ลิงก์(นี้|ด้านล่าง|ข้างล่าง)?/gi, "ปุ่มด้านล่าง")
      .replace(/(link|url)(\s*(this|below|ด้านล่าง|ข้างล่าง))?/gi, "ปุ่มด้านล่าง")
      .replace(/[:：]\s*$/g, "")
      .trim();

    if (!normalized) {
      normalized = "สามารถดำเนินการต่อได้โดยคลิกที่ปุ่มด้านล่าง";
    } else if (!normalized.includes("คลิกที่ปุ่ม")) {
      normalized = `${normalized}\nคลิกที่ปุ่มด้านล่าง`;
    }
  }

  return normalized || content.trim();
}

function cleanUrl(url: string) {
  return url.replace(/[),.;!?]+$/g, "").trim();
}

function extractMessageLinks(content: string) {
  const links: BubbleLink[] = [];
  const seen = new Set<string>();

  const addLink = (urlRaw: string, labelRaw: string) => {
    const url = cleanUrl(urlRaw);
    if (!/^https?:\/\//i.test(url)) {
      return;
    }

    const key = url.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    links.push({
      url,
      label: labelRaw.trim() || "Open link",
    });
  };

  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let markdownMatch = markdownLinkRegex.exec(content);
  while (markdownMatch) {
    addLink(markdownMatch[2], markdownMatch[1]);
    markdownMatch = markdownLinkRegex.exec(content);
  }

  const plainUrlRegex = /https?:\/\/[^\s)]+/g;
  let plainUrlMatch = plainUrlRegex.exec(content);
  while (plainUrlMatch) {
    addLink(plainUrlMatch[0], "Open link");
    plainUrlMatch = plainUrlRegex.exec(content);
  }

  return links.slice(0, 5);
}

function getLinkLabel(link: BubbleLink, index: number) {
  const normalizedLabel = link.label.toLowerCase();
  if (normalizedLabel.includes("line") || link.url.includes("lin.ee") || link.url.includes("line.me")) {
    return "คลิกเพื่อแอดไลน์";
  }

  if (link.url.includes("facebook.com") || normalizedLabel.includes("facebook")) {
    return "คลิกเพื่อเปิด Facebook";
  }

  if (link.label !== "Open link") {
    return link.label.length > 22 ? `${link.label.slice(0, 21)}…` : link.label;
  }

  try {
    const hostname = new URL(link.url).hostname.replace(/^www\./i, "");
    if (hostname.includes("truefiberhome")) {
      return "คลิกเพื่อดูรายละเอียด";
    }

    return `คลิกเปิด ${hostname || `ลิงก์ ${index + 1}`}`;
  } catch {
    return `คลิกที่ปุ่ม ${index + 1}`;
  }
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isVisitor = message.senderType === "VISITOR";
  const isAdmin = message.senderType === "ADMIN";
  const isSystem = message.senderType === "SYSTEM";
  const links = extractMessageLinks(message.content);
  const content = normalizeMessageText(message.content, links.length > 0);

  const containerClass = isVisitor ? "justify-end" : "justify-start";

  const bubbleClass = isVisitor
    ? "bg-gradient-to-br from-[#e61c50] to-[#c41445] text-white"
    : isAdmin
      ? "bg-gradient-to-br from-[#111b4f] to-[#0a1238] text-white"
      : isSystem
        ? "bg-amber-100 text-amber-900"
        : "border border-slate-200 bg-white text-slate-900";

  const linkButtonClass = isVisitor
    ? "border border-white/45 bg-white/15 text-white hover:bg-white/25"
    : isAdmin
      ? "border border-white/25 bg-white/10 text-white hover:bg-white/20"
      : isSystem
        ? "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
        : "border border-[#f4bfd0] bg-[#fff3f7] text-[#c71b49] hover:bg-[#ffe8ef]";

  return (
    <div className={`flex ${containerClass}`}>
      <div className="max-w-[88%] space-y-1">
        <div className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${bubbleClass}`}>
          <p className="whitespace-pre-line break-words">{content}</p>
          {links.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {links.map((link, index) => (
                <a
                  key={`${link.url}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${linkButtonClass}`}
                >
                  {getLinkLabel(link, index)}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <p className={`text-[11px] ${isVisitor ? "text-right text-slate-500" : "text-slate-500"}`}>
          {formatClock(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
