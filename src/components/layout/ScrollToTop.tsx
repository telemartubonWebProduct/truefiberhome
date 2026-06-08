"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    let scheduled = false;

    const updateVisibility = () => {
      scheduled = false;
      setShowButton((current) => {
        const next = window.scrollY > 600;
        return current === next ? current : next;
      });
    };

    const handleScroll = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(updateVisibility);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!showButton) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="กลับไปด้านบน"
      className="fixed bottom-24 right-4 z-50 flex min-h-11 items-center rounded-full bg-black px-4 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black lg:bottom-8"
    >
      กลับด้านบน
    </button>
  );
}
