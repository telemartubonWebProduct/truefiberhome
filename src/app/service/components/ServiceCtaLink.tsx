"use client";

import { trackLineClick } from "@/src/lib/track-event";

interface ServiceCtaLinkProps {
  href: string;
  label: string;
  className?: string;
}

/**
 * Client-side CTA link for the Service page hero.
 * Tracks LINE clicks when the user taps the "เช็กพื้นที่บริการ" button.
 */
export default function ServiceCtaLink({ href, label, className }: ServiceCtaLinkProps) {
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={className}
      onClick={() => {
        if (isExternal) {
          trackLineClick("service_hero_cta", href);
        }
      }}
    >
      {label}
    </a>
  );
}
