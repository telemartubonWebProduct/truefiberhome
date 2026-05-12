"use client";

import { trackLineClick, trackPhoneClick, trackFacebookClick } from "@/src/lib/track-event";

interface ServiceContactCardProps {
  label: string;
  value: string;
  subText: string;
  href: string;
  type: "phone" | "line" | "facebook" | "location";
  children: React.ReactNode;
}

export default function ServiceContactCard({
  href,
  type,
  children,
}: ServiceContactCardProps) {
  const handleClick = () => {
    switch (type) {
      case "line":
        trackLineClick("service_contact", href);
        break;
      case "phone":
        trackPhoneClick("service_contact", href.replace(/^tel:/i, ""));
        break;
      case "facebook":
        trackFacebookClick("service_contact", href);
        break;
      // location — no tracking needed
    }
  };

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
