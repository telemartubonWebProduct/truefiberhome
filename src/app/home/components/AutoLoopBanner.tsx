"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type BannerSlide = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  mobileImage?: string | null;
  image?: string | null;
};

type AutoLoopBannerProps = {
  banners?: BannerSlide[];
};

const fallbackSlides: BannerSlide[] = [
  {
    id: 1,
    title: "โปรเน็ตบ้านทรู",
    image:
      "https://images.contentstack.io/v3/assets/blt8ba403bee4433fd8/blt3813f2889a82cb5b/6982acb69e7fce6dc9af6763/banner-true-id-tv-gen-3-02.jpg",
  },
];

export default function AutoLoopBanner({ banners = [] }: AutoLoopBannerProps) {
  const slides = banners.filter((slide) => (slide.imageUrl || slide.image)?.trim());
  const displaySlides = slides.length > 0 ? slides : fallbackSlides;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (displaySlides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % displaySlides.length);
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [displaySlides.length]);

  const activeSlide = displaySlides[activeIndex] || displaySlides[0];
  const desktopImage = activeSlide.imageUrl || activeSlide.image || "";
  const mobileImage = activeSlide.mobileImage || desktopImage;
  const alt =
    activeSlide.title || activeSlide.description || `โปรโมชัน ${activeIndex + 1}`;

  return (
    <section
      className="relative min-h-[300px] w-full flex-[2] overflow-hidden rounded-xl border border-slate-200 bg-slate-950"
      aria-roledescription="carousel"
      aria-label="โปรโมชันแนะนำ"
    >
      <picture>
        {mobileImage !== desktopImage ? (
          <source media="(max-width: 639px)" srcSet={mobileImage} />
        ) : null}
        <Image
          key={desktopImage}
          src={desktopImage}
          alt={alt}
          fill
          className="object-contain object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </picture>

      {displaySlides.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {displaySlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`แสดงโปรโมชัน ${index + 1}`}
              aria-current={index === activeIndex}
              className="flex h-4 w-7 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span
                aria-hidden="true"
                className={`block h-2 rounded-full ${
                  index === activeIndex ? "w-7 bg-white" : "w-2 bg-white/60"
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
