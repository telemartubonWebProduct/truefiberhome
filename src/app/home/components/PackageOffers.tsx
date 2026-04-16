"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Box, Container, Typography, Button } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import Link from "next/link";
import type { CardItem } from "@/src/types/package";
import { topupCardItems as defaultTopup, monthlyCardItems as defaultMonthly } from "@/src/data/package-offers";

// Animation variants
const cardVariants = {
  rest: { scale: 1, transition: { duration: 0.3, ease: "linear" } },
  hover: { scale: 1.03, transition: { duration: 0.3, ease: "linear" } },
};

const imgVariants = {
  rest: { opacity: 1 },
  hover: { opacity: 0, transition: { duration: 0.3 } },
};

const hoverImgVariants = {
  rest: { opacity: 0 },
  hover: { opacity: 1, transition: { duration: 0.3 } },
};

const logoOverlayVariants = {
  rest: {
    opacity: 1,
    backdropFilter: "blur(-50px)",
    backgroundColor: "rgba(251, 31, 31, 0.8)",
    transition: { duration: 0.3 },
  },
  hover: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

const textBoxVariants = {
  rest: { backgroundColor: "#ffffff", color: "black", transition: { duration: 0.3 } },
  hover: { backgroundColor: "#f44336", color: "white", transition: { duration: 0.3 } },
};

interface PackageOffersProps {
  topupData?: any[];
  monthlyData?: any[];
}

export default function PackageOffers({ topupData, monthlyData }: PackageOffersProps) {
  const [selectedCategory, setSelectedCategory] = useState("topup");

  // Use DB data with static fallbacks
  const itemsTopUp: CardItem[] =
    topupData && Array.isArray(topupData) && topupData.length > 0 ? topupData : defaultTopup;
  const itemsMonthly: CardItem[] =
    monthlyData && Array.isArray(monthlyData) && monthlyData.length > 0 ? monthlyData : defaultMonthly;

  const getCategoryItems = () => {
    if (selectedCategory === "topup") return itemsTopUp;
    if (selectedCategory === "monthly") return itemsMonthly;
    return [];
  };

  const itemsToRender = getCategoryItems();

  return (
    <Box
      sx={{
        backgroundImage: "url('/assets/backgrounds/bg-sc-package-add-ons.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "650px",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Box className=" top-0 left-0 w-full h-full z-10 my-8">
          <Typography sx={{ fontFamily: "Prompt" }} variant="h5" component="h2" color="#ffffff">
            แพ็กเกจเสริมสำหรับคุณ
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Button
            sx={{
              fontFamily: "Prompt",
              borderRadius: "30px",
              borderColor: selectedCategory === "topup" ? "#FB4141" : "#FFFFFF",
              backgroundColor: selectedCategory === "topup" ? "#FB4141" : "",
              color: selectedCategory === "topup" ? "#FFFFFF" : "#ffffff",
              "&:hover": { backgroundColor: "#FB4141", color: "#ffffff" },
            }}
            variant={selectedCategory === "topup" ? "contained" : "outlined"}
            onClick={() => setSelectedCategory("topup")}
          >
            เติมเงิน
          </Button>

          <Button
            sx={{
              fontFamily: "Prompt",
              borderRadius: "30px",
              borderColor: selectedCategory === "monthly" ? "#FB4141" : "#FFFFFF",
              backgroundColor: selectedCategory === "monthly" ? "#FB4141" : "",
              color: selectedCategory === "monthly" ? "#FFFFFF" : "#ffffff",
              "&:hover": { backgroundColor: "#FB4141", color: "#ffffff" },
            }}
            variant={selectedCategory === "monthly" ? "contained" : "outlined"}
            onClick={() => setSelectedCategory("monthly")}
          >
            รายเดือน
          </Button>
        </Box>

        {/* Swiper slides */}
        <Swiper
          slidesPerView={1.2}
          spaceBetween={16}
          breakpoints={{
            640: { slidesPerView: 2.2, spaceBetween: 16 },
            960: { slidesPerView: 3.2, spaceBetween: 16 },
            1200: { slidesPerView: 4.2, spaceBetween: 16 },
          }}
          className="w-full mx-auto"
        >
          {itemsToRender.map((item, index) => (
            <SwiperSlide key={index}>
              <Link href={item.path}>
                <motion.div
                  className="flex flex-col rounded-3xl overflow-hidden relative"
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                  style={{ minHeight: "380px" }}
                >
                  <Box sx={{ position: "relative", width: "100%", height: 220 }}>
                    <motion.div
                      variants={logoOverlayVariants}
                      style={{
                        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                        display: "flex", justifyContent: "center", alignItems: "center",
                        backdropFilter: "blur(10px)", backgroundColor: "rgba(255, 255, 255, 0.6)", zIndex: 1,
                      }}
                    >
                      <motion.img
                        src="/logo_true.webp"
                        alt="Logo"
                        style={{ width: "100px", height: "100px", objectFit: "contain", filter: "drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.5))" }}
                      />
                    </motion.div>

                    <motion.img src={item.image} alt={item.title} loading="lazy" decoding="async" width={400} height={220} className="w-full h-full object-cover absolute top-0 left-0" variants={imgVariants} />
                    <motion.img src={item.hoverImage} alt={`${item.title} – ดูรายละเอียดเพิ่มเติม`} loading="lazy" decoding="async" width={400} height={220} className="w-full h-full object-cover absolute top-0 left-0" variants={hoverImgVariants} />
                  </Box>

                  <motion.div
                    style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "1rem" }}
                    variants={textBoxVariants}
                  >
                    <Typography variant="h5" sx={{ fontFamily: "Prompt", fontWeight: 600, mb: 1, color: "black" }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: "Prompt", color: "black" }}>
                      {item.detail}
                    </Typography>
                    <motion.img src="/assets/PackagePlan/Topup/navigation.webp" className="w-6 h-6" />
                    <motion.div className="flex justify-center items-center">
                      {item.package && item.package.length > 0
                        ? item.package.map((promo, pIndex) => (
                            <motion.img key={pIndex} src={promo.icon} title={promo.title} alt={`Promotion icon ${pIndex}`} className="w-10 h-10 mx-auto" />
                          ))
                        : null}
                    </motion.div>
                  </motion.div>
                </motion.div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </Box>
  );
}
