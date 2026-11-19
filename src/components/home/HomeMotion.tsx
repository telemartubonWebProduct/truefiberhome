"use client";

import { useEffect } from "react";

/**
 * Page-level motion for the homepage: scroll reveal for `.rv` elements, the
 * stacked numeral in the hero, and the side words that slide in on scroll.
 * Content stays visible when this never runs.
 */
export default function HomeMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const big = document.getElementById("tfh-big");
    const timer = window.setTimeout(() => big?.classList.add("go"), reduced ? 0 : 300);

    if (reduced || !("IntersectionObserver" in window)) {
      return () => window.clearTimeout(timer);
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

    const hero = document.getElementById("tfh-hero");
    const left = Array.from(document.querySelectorAll<HTMLElement>("#tfh-words-left li"));
    const right = Array.from(document.querySelectorAll<HTMLElement>("#tfh-words-right li"));

    const update = () => {
      if (!hero) return;
      const progress = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.4)));
      const scale = window.innerWidth < 1000 ? 0.5 : 1;
      const opacity = String(0.8 + progress * 0.2);
      left.forEach((element, index) => {
        element.style.transform = `translateX(${index * 46 * scale * (1 - progress)}px)`;
        element.style.opacity = opacity;
      });
      right.forEach((element, index) => {
        element.style.transform = `translateX(${-index * 46 * scale * (1 - progress)}px)`;
        element.style.opacity = opacity;
      });
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      root.classList.remove("js-rv");
    };
  }, []);

  return null;
}
