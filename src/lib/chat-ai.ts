import type { ChatMessage } from "@prisma/client";

interface GenerateAiReplyInput {
  latestMessage: string;
  history: ChatMessage[];
  knowledgeContext?: string | null;
}

const DEFAULT_SYSTEM_PROMPT =
  [
    "You are a customer support assistant for True Fiber Home, a Thai telecom service.",
    "Always answer in Thai unless the user asks for another language.",
    "You must answer ONLY from the provided Website Knowledge Context.",
    "Never use outside knowledge, assumptions, or guessed details.",
    "Never invent package names, prices, speeds, conditions, or benefits.",
    "For package recommendations with a user budget, treat budget as a hard ceiling and never include packages above budget.",
    "If no package exists within the stated budget, reply exactly: ไม่พบแพ็กเกจในงบ [X] บาท กรุณาระบุงบใหม่หรือต้องการดูตัวเลือกใกล้เคียงไหมครับ?",
    "If required information is not found in context, reply exactly: ขออภัย ไม่พบข้อมูลในระบบ กรุณาติดต่อเจ้าหน้าที่ที่ [contact]",
    "If the context does not contain enough information, respond with the fallback sentence exactly.",
    "Keep replies concise and practical, no more than 4 short bullet points or 3 short sentences.",
    "Do not use markdown formatting symbols such as **bold** or [text](url).",
    "If you share links, put each URL on a separate line.",
    "When relevant, suggest handing off to a human agent.",
  ].join(" ");

const FALLBACK_AI_REPLY =
  "ขอบคุณสำหรับข้อความครับ ตอนนี้ระบบกำลังเชื่อมต่อเจ้าหน้าที่อยู่ กรุณารอสักครู่ครับ";

const OUT_OF_SCOPE_REPLY =
  "ขออภัย ตอนนี้ยังไม่พบข้อมูลนี้ในเว็บไซต์ True Fiber Home กรุณาแจ้งเจ้าหน้าที่เพื่อช่วยตรวจสอบข้อมูลล่าสุดให้ครับ";

function mapMessageForModel(message: ChatMessage) {
  if (message.senderType === "AI") {
    return {
      role: "assistant",
      content: message.content,
    };
  }

  if (message.senderType === "SYSTEM") {
    return {
      role: "system",
      content: message.content,
    };
  }

  return {
    role: "user",
    content: message.content,
  };
}

export async function generateAiReply({ latestMessage, history, knowledgeContext }: GenerateAiReplyInput) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return FALLBACK_AI_REPLY;
  }

  if (!knowledgeContext || knowledgeContext.trim().length === 0) {
    return OUT_OF_SCOPE_REPLY;
  }

  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  const systemPrompt = process.env.CHATBOT_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;

  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "system",
      content: [
        "Website Knowledge Context (authoritative source):",
        knowledgeContext.trim(),
        `Fallback sentence (use exactly when answer is not in context): ${OUT_OF_SCOPE_REPLY}`,
      ].join("\n\n"),
    },
    ...history.map(mapMessageForModel),
    {
      role: "user",
      content: latestMessage,
    },
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0,
        top_p: 0.2,
        max_tokens: 280,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const bodyText = await response.text();
      console.error("OpenRouter request failed", response.status, bodyText);
      return FALLBACK_AI_REPLY;
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = payload.choices?.[0]?.message?.content?.trim();
    return content || OUT_OF_SCOPE_REPLY;
  } catch (error) {
    console.error("OpenRouter call failed", error);
    return OUT_OF_SCOPE_REPLY;
  }
}
