"use client";

import { useEffect } from "react";

export default function N8nChat({ webhookUrl }: { webhookUrl: string }) {
  useEffect(() => {
    if (!webhookUrl) return;

    const cssId = "n8n-chat-css";
    const cssHref = "https://cdn.jsdelivr.net/npm/@n8n/chat@1.14.0/dist/style.css";
    const existingLink = document.getElementById(cssId) as HTMLLinkElement | null;

    if (existingLink) {
      if (existingLink.href !== cssHref) {
        existingLink.href = cssHref;
      }
    } else {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = cssHref;
      document.head.appendChild(link);
    }

    let cancelled = false;
    let chatApp: { unmount?: () => void } | undefined;

    // แก้ไข warning ของ Vue Feature Flags ที่มาจาก @n8n/chat
    (window as any).__VUE_OPTIONS_API__ = true;
    (window as any).__VUE_PROD_DEVTOOLS__ = false;
    (window as any).__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;

    import("@n8n/chat")
      .then(({ createChat }) => {
        if (cancelled) return;

        chatApp = createChat({
          webhookUrl,
          initialMessages: [
            "สวัสดีครับ! 👋",
            "เริ่มต้นการสนทนาได้เลยครับ เราพร้อมช่วยเหลือคุณตลอด 24 ชั่วโมงครับ",
          ],
          i18n: {
            en: {
              title: "สวัสดีครับ! 👋",
              subtitle: "เริ่มต้นการสนทนาได้เลยครับ เราพร้อมช่วยเหลือคุณตลอด 24 ชั่วโมงครับ",
              footer: "",
              getStarted: "สนทนาใหม่",
              inputPlaceholder: "พิมพ์คำถามของคุณ..",
              closeButtonTooltip: "ปิด",
            },
            th: {
              title: "สวัสดีครับ! 👋",
              subtitle: "เริ่มต้นการสนทนาได้เลยครับ เราพร้อมช่วยเหลือคุณตลอด 24 ชั่วโมงครับ",
              footer: "",
              getStarted: "สนทนาใหม่",
              inputPlaceholder: "พิมพ์คำถามของคุณ..",
              closeButtonTooltip: "ปิด",
            },
          },
        });
      })
      .catch((err) => {
        console.error("Failed to load n8n chat:", err);
      });

    return () => {
      cancelled = true;
      chatApp?.unmount?.();
    };
  }, [webhookUrl]);

  return null;
}
