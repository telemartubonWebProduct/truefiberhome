"use client";

import { useEffect } from "react";

/**
 * Page-level motion for the homepage: scroll reveal for `.rv` elements.
 * Content stays visible when this never runs.
 */
export default function HomeMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      return;
    }

    root.classList.add("js-rv");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll(".tfh .rv").forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      root.classList.remove("js-rv");
    };
  }, []);

  return null;
}
