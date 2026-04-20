"use client";

import { usePathname } from "next/navigation";
import ChatWidget from "@/src/components/chat/ChatWidget";

export default function ChatWidgetVisibility() {
  const pathname = usePathname();
  const isHiddenRoute =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/backend");

  if (isHiddenRoute) {
    return null;
  }

  return <ChatWidget />;
}
