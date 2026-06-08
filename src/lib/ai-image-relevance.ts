export type SourceImageEvidence = {
  url: string;
  alt: string;
  context: string;
};

type ImagePlacement = "banner" | "article-cover" | "package-card";

const BLOCKED_IMAGE_TERMS = [
  "logo",
  "icon",
  "ico-",
  "favicon",
  "sprite",
  "qr",
  "app-store",
  "google-play",
  "badge",
  "avatar",
  "wallet",
  "call-center",
];

const TOPIC_TERMS = [
  "internet",
  "online",
  "fiber",
  "fibre",
  "wifi",
  "router",
  "broadband",
  "package",
  "promotion",
  "netflix",
  "youtube",
  "mesh",
  "gaming",
  "home",
  "ติดตั้ง",
  "ย้ายจุด",
  "เน็ตบ้าน",
  "อินเทอร์เน็ต",
  "ไฟเบอร์",
  "เราเตอร์",
  "แพ็กเกจ",
  "โปรโมชั่น",
  "ความเร็ว",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFC")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function queryAspectRatio(url: string) {
  try {
    const parsed = new URL(url);
    const width = Number(parsed.searchParams.get("width") || parsed.searchParams.get("w"));
    const height = Number(parsed.searchParams.get("height") || parsed.searchParams.get("h"));
    if (width > 0 && height > 0) return width / height;
  } catch {
    return null;
  }
  return null;
}

function significantTerms(value: string) {
  const normalized = normalize(value);
  const words = normalized
    .split(" ")
    .filter((word) => word.length >= 3 && !/^\d+$/.test(word));
  const knownTerms = TOPIC_TERMS.filter((term) => normalized.includes(term));
  return Array.from(new Set([...words, ...knownTerms]));
}

export function scoreImageRelevance({
  evidence,
  title,
  description,
  placement,
}: {
  evidence: SourceImageEvidence;
  title: string;
  description?: string | null;
  placement: ImagePlacement;
}) {
  const pathname = (() => {
    try {
      return decodeURIComponent(new URL(evidence.url).pathname);
    } catch {
      return evidence.url;
    }
  })();
  const imageText = normalize(
    `${pathname} ${evidence.alt} ${evidence.context}`
  );
  const contentText = normalize(`${title} ${description || ""}`);
  const blockedTerm = BLOCKED_IMAGE_TERMS.find((term) => imageText.includes(term));

  if (blockedTerm) {
    return {
      accepted: false,
      confidence: 0,
      reason: `Rejected because the image looks like a ${blockedTerm} asset.`,
    };
  }

  if (placement !== "package-card" && /\.svg(?:$|\?)/i.test(evidence.url)) {
    return {
      accepted: false,
      confidence: 0,
      reason: "Rejected because editorial and banner placements require a raster image.",
    };
  }

  const aspectRatio = queryAspectRatio(evidence.url);
  if (placement === "banner" && aspectRatio !== null && aspectRatio < 1.5) {
    return {
      accepted: false,
      confidence: 0,
      reason: "Rejected because the source dimensions are not landscape enough for a banner.",
    };
  }

  const contentTerms = significantTerms(contentText);
  const matchedTerms = contentTerms.filter((term) => imageText.includes(term));
  const topicMatches = TOPIC_TERMS.filter(
    (term) => contentText.includes(term) && imageText.includes(term)
  );
  const hasUsefulAlt = normalize(evidence.alt).length >= 5;
  const hasPlacementHint =
    placement === "banner"
      ? /(banner|hero|3840x|1920x|wide)/i.test(pathname)
      : placement === "article-cover"
        ? /(content|thumbnail|article|560x314|900x|1080x)/i.test(pathname)
        : /(pack-card|package|card)/i.test(pathname);

  let confidence = 0.2;
  confidence += Math.min(0.4, matchedTerms.length * 0.1);
  confidence += Math.min(0.2, topicMatches.length * 0.08);
  if (hasUsefulAlt) confidence += 0.1;
  if (hasPlacementHint) confidence += 0.15;
  confidence = Math.min(0.99, Number(confidence.toFixed(2)));

  const minimumConfidence =
    placement === "banner" ? 0.58 : placement === "article-cover" ? 0.5 : 0.45;

  return {
    accepted: confidence >= minimumConfidence,
    confidence,
    reason:
      matchedTerms.length > 0
        ? `Matched image evidence: ${matchedTerms.slice(0, 5).join(", ")}.`
        : "Rejected because the image filename, alt text, and nearby source copy do not match the content.",
  };
}

export function describeImageEvidence(evidence: SourceImageEvidence) {
  return [
    `[SOURCE_IMAGE src="${evidence.url}"]`,
    `alt="${evidence.alt || "-"}"`,
    `nearby="${evidence.context || "-"}"`,
  ].join(" ");
}
