import type { ContentAgentScope } from "@/src/types/content-agent";

export type ContentAgentModelOption = {
  value: string;
  label: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  description: string;
  recommendedFor: ContentAgentScope[];
};

export const CONTENT_AGENT_MODEL_OPTIONS: ContentAgentModelOption[] = [
  {
    value: "openai/gpt-4.1-nano",
    label: "GPT-4.1 Nano - ประหยัด",
    inputUsdPerMillion: 0.1,
    outputUsdPerMillion: 0.4,
    description: "ต้นทุนต่ำ เหมาะกับงานตรวจซ้ำและข้อมูลรูปแบบคงที่",
    recommendedFor: [],
  },
  {
    value: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite - ประหยัด",
    inputUsdPerMillion: 0.1,
    outputUsdPerMillion: 0.4,
    description: "รองรับบริบทยาวและภาษาไทยดี เหมาะกับรันถี่",
    recommendedFor: [],
  },
  {
    value: "openai/gpt-4.1-mini",
    label: "GPT-4.1 Mini - แนะนำสำหรับโปรโมชัน",
    inputUsdPerMillion: 0.4,
    outputUsdPerMillion: 1.6,
    description: "ทำ structured output แม่น เหมาะกับราคา ความเร็ว และเงื่อนไขแพ็กเกจ",
    recommendedFor: ["promotion"],
  },
  {
    value: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash - คุณภาพสูงแบบ Stable",
    inputUsdPerMillion: 0.3,
    outputUsdPerMillion: 2.5,
    description: "เหมาะกับข้อความภาษาไทยและการคัดเนื้อหาหลายส่วน",
    recommendedFor: [],
  },
  {
    value: "google/gemini-3.1-flash-lite-preview",
    label: "Gemini 3.1 Flash Lite - แนะนำสำหรับดึงข้อมูล",
    inputUsdPerMillion: 0.25,
    outputUsdPerMillion: 1.5,
    description:
      "แม่นด้าน data extraction และใช้กับงานอัตโนมัติปริมาณมากได้คุ้มกว่า",
    recommendedFor: ["site-content"],
  },
  {
    value: "google/gemini-3-flash-preview",
    label: "Gemini 3 Flash Preview - แนะนำสำหรับคอนเทนต์",
    inputUsdPerMillion: 0.5,
    outputUsdPerMillion: 3,
    description: "คุณภาพสูงขึ้นสำหรับงานคอนเทนต์และบริบทยาว แต่ยังเป็นรุ่น Preview",
    recommendedFor: ["site-content", "article"],
  },
];

export const DEFAULT_PROMOTION_AGENT_MODEL = "openai/gpt-4.1-mini";
export const DEFAULT_SITE_CONTENT_AGENT_MODEL =
  "google/gemini-3.1-flash-lite-preview";
export const DEFAULT_ARTICLE_AGENT_MODEL = "google/gemini-3-flash-preview";
export const ESTIMATED_USD_TO_THB = 33;

export function getContentAgentModel(value: string) {
  return CONTENT_AGENT_MODEL_OPTIONS.find((model) => model.value === value);
}

export function isSupportedContentAgentModel(value: string) {
  return Boolean(getContentAgentModel(value));
}

export function estimateContentAgentCost({
  scope,
  model,
  maxItems,
}: {
  scope: ContentAgentScope;
  model: string;
  maxItems: number;
}) {
  const option = getContentAgentModel(model);
  if (!option) return null;

  const inputTokens =
    scope === "promotion" ? 28_000 : scope === "article" ? 52_000 : 40_000;
  const outputTokens = Math.min(
    scope === "article" ? 8_000 : 6_000,
    500 +
      maxItems *
        (scope === "promotion" ? 260 : scope === "article" ? 1_800 : 320),
  );
  const usd =
    (inputTokens / 1_000_000) * option.inputUsdPerMillion +
    (outputTokens / 1_000_000) * option.outputUsdPerMillion;

  return {
    inputTokens,
    outputTokens,
    usd,
    thb: usd * ESTIMATED_USD_TO_THB,
    monthlyUsd: usd * 30,
    monthlyThb: usd * 30 * ESTIMATED_USD_TO_THB,
  };
}
