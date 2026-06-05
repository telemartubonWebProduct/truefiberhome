"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade } from "swiper/modules";
import { Box } from "@mui/material";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";

type BannerSlide = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  image?: string | null;
};

type AutoLoopBannerProps = {
  banners?: BannerSlide[];
};

const BANNER_ASPECT_RATIO = 907 / 300;

const fallbackSlides: BannerSlide[] = [
    {
      id: 1,
      image: "https://mms.img.susercontent.com/th-11134210-7qukx-lkj9ox5urx7td5",

    },
    {
      id: 2,
      image: "https://images.contentstack.io/v3/assets/blt8ba403bee4433fd8/blt3813f2889a82cb5b/6982acb69e7fce6dc9af6763/banner-true-id-tv-gen-3-02.jpg",

    },
    {
      id: 3,
      image: "https://images.contentstack.io/v3/assets/blt8ba403bee4433fd8/blt9f8824d17aed407a/69d4868ce94b4816c55ef77e/truex-cloud-12month-7apr2026-1040x1040.jpg?auto=webp&quality=85",

    }
  ];

export default function AutoLoopBanner({ banners = [] }: AutoLoopBannerProps) {
  const slides = banners.filter((slide) => (slide.imageUrl || slide.image)?.trim());
  const displaySlides = slides.length > 0 ? slides : fallbackSlides;

  return (
    <Box
      sx={{
        flex: 2,
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        minHeight: { xs: 220, md: 300 },
        aspectRatio: BANNER_ASPECT_RATIO,
        backgroundColor: "#0b1220",
      }}
    >
      <Swiper
        modules={[EffectFade]}
        effect="fade"
        loop={true}
        allowTouchMove={true}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        {displaySlides.map((slide, index) => {
          const image = slide.imageUrl || slide.image || "";
          const alt = slide.title || slide.description || `Slide ${index + 1}`;

          return (
            <SwiperSlide key={slide.id}>
              <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                <Box
                  component="img"
                  src={image}
                  alt=""
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "blur(16px)",
                    transform: "scale(1.08)",
                    opacity: 0.55,
                  }}
                />
                <Box
                  component="img"
                  src={image}
                  alt={alt}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    objectPosition: "center",
                    p: { xs: 1, md: 1.5 },
                  }}
                />
              </Box>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </Box>
  );
}
