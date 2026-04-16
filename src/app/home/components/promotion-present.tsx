"use client";

import { Box, Typography, Button, IconButton } from "@mui/material";
import Image from "next/image";
import { motion } from "framer-motion";
import gigatexRouter from "@/src/assets/GigaTex_router.webp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useRef, useState, useEffect, useCallback } from "react";
import { lineSupport } from "@/src/context/line-path";

interface GiftItem {
  image?: string;
  label: string;
}

interface PackageData {
  id: number | string;
  tag: string;
  name: string;
  speed: string;
  price: string;
  freebies: string[];
  gifts: GiftItem[];
  buyUrl?: string;
}

const mockPackages: PackageData[] = [
  {
    id: 1,
    tag: "Standard 499",
    name: "แพ็กเกจมาตรฐาน",
    speed: "500/500",
    price: "499",
    freebies: ["Router WiFi 6"],
    gifts: [
      { image: "/assets/gifts/router.webp", label: "Router WiFi 6" },
    ],
  },
  {
    id: 2,
    tag: "Standard 599",
    name: "แพ็กเกจมาตรฐาน",
    speed: "500/500",
    price: "599",
    freebies: ["Router WiFi 6", "ฟรีติดตั้ง"],
    gifts: [
      { image: "/assets/gifts/router.webp", label: "Router WiFi 6" },
      { image: "/assets/gifts/install.webp", label: "ฟรีติดตั้ง" },
    ],
  },
  {
    id: 3,
    tag: "Standard 699",
    name: "แพ็กเกจมาตรฐาน",
    speed: "1000/500",
    price: "699",
    freebies: ["Router WiFi 6", "ฟรีติดตั้ง"],
    gifts: [
      { image: "/assets/gifts/router.webp", label: "Router WiFi 6" },
      { image: "/assets/gifts/install.webp", label: "ฟรีติดตั้ง" },
    ],
  },
  {
    id: 4,
    tag: "Premium 799",
    name: "แพ็กเกจพรีเมียม",
    speed: "1000/1000",
    price: "799",
    freebies: ["Router WiFi 6", "ฟรีติดตั้ง", "Mesh WiFi"],
    gifts: [
      { image: "/assets/gifts/router.webp", label: "Router WiFi 6" },
      { image: "/assets/gifts/install.webp", label: "ฟรีติดตั้ง" },
      { image: "/assets/gifts/mesh.webp", label: "Mesh WiFi" },
    ],
  },
];

interface PromotionPresentProps {
  packages?: PackageData[];
  helperText?: string;
  isActive?: boolean;
}

export default function PromotionPresent({
  packages = [],
  helperText = "เลื่อนเพื่อดูโปรโมชันทั้งหมด",
  isActive = true,
}: PromotionPresentProps) {
  const displayPackages = packages.length > 0 ? packages : mockPackages;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.scrollWidth / displayPackages.length;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, displayPackages.length - 1));
  }, [displayPackages.length]);

  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = container.scrollWidth / displayPackages.length;
    container.scrollTo({ left: cardWidth * index, behavior: "smooth" });
    setActiveIndex(index);
  }, [displayPackages.length]);

  // Auto-play
  useEffect(() => {
    if (displayPackages.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % displayPackages.length;
        scrollToIndex(next);
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [displayPackages.length, scrollToIndex]);

  if (!isActive) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "4fr 8fr", xl: "3.5fr 8.5fr" },
        gap: { xs: 4, lg: 6 },
        alignItems: "center",
      }}
    >
      {/* ฝั่งซ้าย (รูปภาพ) */}
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ display: "flex", justifyContent: "center", width: "100%" }}
      >
        <Box
          sx={{
            width: { xs: "65%", sm: "45%", md: "40%", lg: "100%" },
            maxWidth: { xs: "280px", sm: "350px", lg: "500px" },
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Image
            src={gigatexRouter}
            alt="Promotion Present"
            width={500}
            height={500}
            style={{ width: "100%", height: "auto", objectFit: "contain" }}
          />
        </Box>
      </motion.div>

      {/* ฝั่งขวา — Scroll Cards */}
      <Box sx={{ minWidth: 0, width: "100%" }}>
       
        <Typography
          variant="body2"
          sx={{
            color: "#9ca3af",
            mb: 4,
            textAlign: { xs: "center", xl: "left" },
            fontWeight: 500,
          }}
        >
          {helperText}
        </Typography>

        {/* Scrollable card container */}
        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            display: "flex",
            gap: 2.5,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            pb: 2,
            px: 0.5,
            "&::-webkit-scrollbar": { height: 0, display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {displayPackages.map((pkg) => (
            <Box
              key={pkg.id}
              sx={{
                minWidth: { xs: "85%", sm: "45%", md: "38%", lg: "45%", xl: "31%" },
                maxWidth: { xs: "85%", sm: "45%", md: "38%", lg: "45%", xl: "31%" },
                scrollSnapAlign: "start",
                flexShrink: 0,
              }}
            >
              <PromotionCard pkg={pkg} />
            </Box>
          ))}
        </Box>

        {/* Navigation & Pagination */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            mt: 2.5,
          }}
        >
          <IconButton
            onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            sx={{ 
              bgcolor: "#f3f4f6", 
              "&:hover": { bgcolor: "#e5e7eb" },
              "&.Mui-disabled": { opacity: 0.5 }
            }}
            size="small"
          >
            <ArrowBackIosNewIcon fontSize="small" sx={{ fontSize: "1rem" }} />
          </IconButton>

          <Box sx={{ display: "flex", gap: 1 }}>
            {displayPackages.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => scrollToIndex(idx)}
                sx={{
                  width: activeIndex === idx ? 28 : 10,
                  height: 10,
                  borderRadius: "5px",
                  bgcolor: activeIndex === idx ? "#3466F6" : "#d1d5db",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: activeIndex === idx ? "#3466F6" : "#9ca3af",
                  },
                }}
              />
            ))}
          </Box>

          <IconButton
            onClick={() => scrollToIndex(Math.min(displayPackages.length - 1, activeIndex + 1))}
            disabled={activeIndex === displayPackages.length - 1}
            sx={{ 
              bgcolor: "#f3f4f6", 
              "&:hover": { bgcolor: "#e5e7eb" },
              "&.Mui-disabled": { opacity: 0.5 }
            }}
            size="small"
          >
            <ArrowForwardIosIcon fontSize="small" sx={{ fontSize: "1rem" }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

/* ─────────── Clean Promotion Card ─────────── */
function PromotionCard({ pkg }: { pkg: PackageData }) {
  const normalizedBuyUrl = pkg.buyUrl?.trim();
  const buyUrl = normalizedBuyUrl && normalizedBuyUrl !== "/service" && normalizedBuyUrl !== "#" ? normalizedBuyUrl : lineSupport;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ height: "100%" }}
    >
      <Box
        sx={{
          borderRadius: "20px",
          overflow: "hidden",
          bgcolor: "#fff",
          border: "1px solid #eee",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          transition: "box-shadow 0.3s ease",
          "&:hover": {
            boxShadow: "0 8px 28px rgba(52, 102, 246, 0.12)",
          },
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* ── Tag Strip ── */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #3466F6 0%, #6366f1 100%)",
            px: 2,
            py: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 700 }}
          >
            แพ็กเกจแนะนำ
          </Typography>
          <Box
            sx={{
              bgcolor: "rgba(255,255,255,0.95)",
              px: 1.5,
              py: 0.3,
              borderRadius: "20px",
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, color: "#3466F6", fontSize: "0.7rem" }}
            >
              {pkg.tag}
            </Typography>
          </Box>
        </Box>

        {/* ── Body ── */}
        <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Package name */}
          <Typography
            variant="body2"
            sx={{ color: "#9ca3af", fontWeight: 600, mb: 0.5 }}
          >
            {pkg.name}
          </Typography>

          {/* Speed & Price row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 900, color: "#1a1a2e", lineHeight: 1 }}
              >
                {pkg.speed}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: "#6b7280", mt: 0.3 }}
              >
                Mbps
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Box component="span" sx={{ fontSize: "1.75rem", fontWeight: 900, color: "#3466F6" }}>
                {pkg.price}
              </Box>
              <Box component="span" sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#3466F6", ml: 0.3 }}>
                บาท
              </Box>
              <Typography
                variant="caption"
                sx={{ display: "block", color: "#9ca3af", fontWeight: 600 }}
              >
                / เดือน
              </Typography>
            </Box>
          </Box>

          {/* Divider */}
          <Box sx={{ height: "1px", bgcolor: "#f3f4f6", mb: 2 }} />

          {/* Freebies checklist */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, color: "#1a1a2e", mb: 1, display: "block" }}
            >
              รับทันที!
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
              {pkg.freebies.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <CheckCircleIcon sx={{ color: "#3466F6", fontSize: 16 }} />
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#4b5563", fontSize: "0.8rem" }}
                  >
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* ── Gifts / Items Array ── */}
          {pkg.gifts && pkg.gifts.length > 0 && (
            <Box
              sx={{
                mt: "auto",
                pt: 1.5,
                borderTop: "1px dashed #e5e7eb",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                <CardGiftcardIcon sx={{ fontSize: 14, color: "#3466F6" }} />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "#6b7280", fontSize: "0.7rem" }}
                >
                  ของแถม
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                {pkg.gifts.map((gift, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.5,
                      minWidth: 56,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "12px",
                        bgcolor: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {gift.image ? (
                        <Box
                          component="img"
                          src={gift.image}
                          alt={gift.label}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.parentElement) {
                              const fallback = document.createElement("div");
                              fallback.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="#9ca3af"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>';
                              e.currentTarget.parentElement.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <CardGiftcardIcon sx={{ fontSize: 22, color: "#9ca3af" }} />
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: "#6b7280",
                        fontSize: "0.65rem",
                        textAlign: "center",
                        lineHeight: 1.2,
                        maxWidth: 60,
                      }}
                    >
                      {gift.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* CTA Button */}
          <Button
            component="a"
            href={buyUrl}
            variant="contained"
            fullWidth
            sx={{
              mt: 2.5,
              bgcolor: "#3466F6",
              borderRadius: "14px",
              py: 1.2,
              fontWeight: 700,
              fontSize: "0.875rem",
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(52, 102, 246, 0.3)",
              "&:hover": {
                bgcolor: "#2554d4",
                boxShadow: "0 6px 20px rgba(52, 102, 246, 0.4)",
              },
            }}
          >
            สนใจสมัครบริการ
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
}