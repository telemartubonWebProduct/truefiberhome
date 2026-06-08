"use client";

import type { ReactNode } from "react";
import { trackLineClick } from "@/src/lib/track-event";

type TrackedLineLinkProps = {
  href: string;
  source: string;
  className: string;
  children: ReactNode;
};

export default function TrackedLineLink({
  href,
  source,
  className,
  children,
}: TrackedLineLinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackLineClick(source, href)}
    >
      {children}
    </a>
  );
}
