"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ChatWidget = dynamic(() => import("@/src/components/chat/ChatWidget"), {
  ssr: false,
  loading: () => null,
});

export default function ChatWidgetVisibility() {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const isHiddenRoute =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/backend");

  useEffect(() => {
    if (isHiddenRoute) {
      return;
    }

    let activated = false;
    const activate = () => {
      if (activated) return;
      activated = true;
      setIsReady(true);
    };
    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
    ];
    events.forEach((event) =>
      window.addEventListener(event, activate, { once: true, passive: true })
    );
    const timeoutId = window.setTimeout(activate, 15_000);

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, activate));
    };
  }, [isHiddenRoute]);

  if (isHiddenRoute || !isReady) {
    return null;
  }

  return <ChatWidget />;
}
