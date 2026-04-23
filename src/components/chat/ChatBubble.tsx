import type { ChatMessageDto } from "@/src/types/chat";
import { promotionPackages } from "@/src/data/promotions";
import type { PackageItem } from "@/src/types/package";

interface ChatBubbleProps {
  message: ChatMessageDto;
  promotionContext?: PromotionCardContext | null;
}

type BubbleLink = {
  url: string;
  label: string;
};

export type PromotionFlexType = "home" | "mobile" | "mixed";

export type PromotionCardContext = {
  flexType: PromotionFlexType;
  budget: number | null;
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
  void link;
  void index;
  return "คลิกที่นี่";
}

function getPromotionCards(promotionContext?: PromotionCardContext | null) {
  const sortedPackages = [...promotionPackages]
    .filter((pkg) => pkg.is_active)
    .sort((left, right) => (left.display_order ?? Number.MAX_SAFE_INTEGER) - (right.display_order ?? Number.MAX_SAFE_INTEGER));

  const budget = promotionContext?.budget;
  const budgetFiltered =
    typeof budget === "number"
      ? sortedPackages.filter((pkg) => pkg.price <= budget)
      : sortedPackages;

  if (!promotionContext) {
    return [];
  }

  if (promotionContext.flexType === "home") {
    return budgetFiltered.filter((pkg) => pkg.category_id === 1).slice(0, 4);
  }

  if (promotionContext.flexType === "mobile") {
    return budgetFiltered.filter((pkg) => pkg.category_id === 2).slice(0, 4);
  }

  if (promotionContext.flexType === "mixed") {
    const homePackages = budgetFiltered.filter((pkg) => pkg.category_id === 1).slice(0, 2);
    const mobilePackages = budgetFiltered.filter((pkg) => pkg.category_id === 2).slice(0, 2);
    return [...homePackages, ...mobilePackages];
  }

  return [];
}

function getPromotionSummaryText(pkg: PackageItem) {
  if (pkg.download_speed && pkg.upload_speed && pkg.speed_unit) {
    return `ความเร็ว ${pkg.download_speed}/${pkg.upload_speed} ${pkg.speed_unit}`;
  }

  if (pkg.description?.trim()) {
    return pkg.description.trim();
  }

  if (pkg.perks && pkg.perks.length > 0) {
    return pkg.perks
      .slice(0, 2)
      .map((perk) => perk.text)
      .join(" • ");
  }

  return "แพ็กเกจยอดนิยม";
}

function getPromotionHref(pkg: PackageItem) {
  const normalizedLink = (pkg.buy_link ?? "").trim();
  if (normalizedLink && normalizedLink !== "#") {
    return normalizedLink;
  }

  return pkg.category_id === 1 ? "/boardband" : "/monthly";
}

export default function ChatBubble({ message, promotionContext = null }: ChatBubbleProps) {
  const isVisitor = message.senderType === "VISITOR";
  const isAdmin = message.senderType === "ADMIN";
  const isSystem = message.senderType === "SYSTEM";
  const links = extractMessageLinks(message.content);
  const content = normalizeMessageText(message.content, links.length > 0);
  const promotionCards = !isVisitor && !isSystem ? getPromotionCards(promotionContext) : [];

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
      <div className="max-w-[90%] space-y-1 sm:max-w-[88%]">
        <div className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm sm:px-4 sm:py-3 sm:text-[15px] ${bubbleClass}`}>
          <p className="whitespace-pre-line break-words">{content}</p>
          {promotionCards.length > 0 ? (
            <div className="mt-3">
              <p className={`mb-2 text-[11px] font-semibold ${isAdmin ? "text-white/85" : "text-slate-500"}`}>
                โปรที่แนะนำ
              </p>
              <div className="-mx-0.5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-0.5 pb-1">
                {promotionCards.map((pkg) => {
                  const href = getPromotionHref(pkg);
                  const isExternal = /^https?:\/\//i.test(href);

                  return (
                    <article
                      key={`promotion-flex-${pkg.id}`}
                      className="w-[218px] shrink-0 snap-start rounded-xl border border-[#f4bfd0] bg-white p-3 text-slate-900 shadow-sm"
                    >
                      {pkg.promo_badge ? (
                        <p className="mb-1.5 inline-flex rounded-full bg-[#fff1f6] px-2 py-0.5 text-[10px] font-semibold text-[#c71b49]">
                          {pkg.promo_badge}
                        </p>
                      ) : null}

                      <p className="line-clamp-2 text-[13px] font-bold leading-5">{pkg.name}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-600">{getPromotionSummaryText(pkg)}</p>

                      <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-slate-100 pt-2.5">
                        <p className="text-[20px] font-extrabold leading-none text-[#e61c50]">
                          {pkg.price.toLocaleString("th-TH")}
                          <span className="ml-1 text-[11px] font-semibold text-slate-600">บาท</span>
                        </p>

                        <a
                          href={href}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          className="inline-flex rounded-full bg-[#e61c50] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#cc1846]"
                        >
                          ดูโปร
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}
          {links.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {links.map((link, index) => (
                <a
                  key={`${link.url}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${linkButtonClass}`}
                >
                  {getLinkLabel(link, index)}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <p className={`text-[10px] sm:text-[11px] ${isVisitor ? "text-right text-slate-500" : "text-slate-500"}`}>
          {formatClock(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
