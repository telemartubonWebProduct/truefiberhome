"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import { Box } from "@mui/material";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";

export default function AutoLoopBanner() {
  const slides = [
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

  return (
    <Box sx={{ flex: 2, position: 'relative', borderRadius: '12px', overflow: 'hidden', minHeight: 300 }}>
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
        }}
        loop={true}
        allowTouchMove={true}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, position: 'relative' }}>
              <Box
                component="img"
                src={slide.image} 
                alt={`Slide ${slide.id}`} 
                sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}