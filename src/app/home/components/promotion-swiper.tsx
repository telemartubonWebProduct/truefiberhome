"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,

  Tab,
  Tabs,
  Typography,
  IconButton,
  Stack,
} from "@mui/material";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import SmartphoneOutlinedIcon from "@mui/icons-material/SmartphoneOutlined";

import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useRef, MouseEvent, useEffect } from "react";
import { useSiteSettings } from "@/src/context/SiteSettingsContext";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";

function formatPriceTHB(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

function a11yProps(index: number) {
  return {
    id: `promotion-tab-${index}`,
    "aria-controls": `promotion-tabpanel-${index}`,
  };
}

interface PromotionSwiperProps {
  packages?: any[];
}

export default function PromotionSwiper({ packages = [] }: PromotionSwiperProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Derive categories from packages if available, otherwise use defaults
  const categories = useMemo(() => {
    if (!packages || packages.length === 0) return [];
    const types = new Set(packages.map((p) => p.type || "ทั่วไป"));
    return Array.from(types).map((type, i) => ({
      id: i,
      name: type,
      slug: (type as string).toLowerCase().replace(/\s+/g, '-'),
    }));
  }, [packages]);

  // Fallback to static tabs if no dynamic ones yet, but we'll map dynamically
  const activeCategory = categories[tabIndex];

  const getCategoryLink = (catName?: string) => {
    if (!catName) return "#";
    if (catName.includes("บ้าน")) return "/boardband";
    if (catName.includes("รายเดือน")) return "/monthly";
    if (catName.includes("เติมเงิน")) return "/topup";
    return `/packages/${catName.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const filteredPackages = useMemo(() => {
    if (!activeCategory) return [];
    return packages
      .filter((p) => (p.type || "ทั่วไป") === activeCategory.name)
      .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  }, [activeCategory, packages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      scrollLeft.current = 0;
    }
  }, [tabIndex]);

  const checkArrowVisibility = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10);
  };

  useEffect(() => {
    const timeout = setTimeout(checkArrowVisibility, 100);
    window.addEventListener("resize", checkArrowVisibility);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", checkArrowVisibility);
    };
  }, [filteredPackages, tabIndex]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 1.5; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  if (categories.length === 0) return null;

  return (
    <Box className="w-full" sx={{ py: { xs: 2, md: 3 } }}>
      <Box className="mx-auto w-full max-w-7xl px-4">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{
            mb: 3,
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ width: { xs: "100%", md: "auto" }, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#000" }}>
                โปรโมชันแนะนำ
              </Typography>
              <Typography variant="body2" color="text.secondary">
                เลือกหมวด แล้วเลื่อนดูแพ็กเกจที่ใช่สำหรับคุณ
              </Typography>
            </Box>
            
            <Button
              href={getCategoryLink(activeCategory?.name)} 
              endIcon={<ArrowForwardIosIcon sx={{ fontSize: "12px !important", ml: -0.5 }} />}
              sx={{
                display: { xs: "flex", md: "none" },
                color: "error.main",
                fontWeight: 800,
                whiteSpace: "nowrap",
                mt: 0.5,
              }}
            >
              ดูทั้งหมด
            </Button>
          </Box>

          <Stack
            direction="row"
            spacing={2}
            sx={{ width: { xs: "100%", md: "auto" }, alignItems: "center" }}
          >
            <Tabs
              value={tabIndex}
              onChange={(_, v) => setTabIndex(v)}
              variant="scrollable"
              allowScrollButtonsMobile
              sx={{
                minHeight: 40,
                "& .MuiTabs-flexContainer": {
                  gap: 1.5,
                },
                "& .MuiTab-root": {
                  minHeight: 40,
                  px: 3,
                  textTransform: "none",
                  fontWeight: 800,
                  borderRadius: 999,
                  border: "1.5px solid",
                  transition: "all 0.2s ease-in-out",
                },
                "& .MuiTabs-indicator": { height: 0 },
              }}
            >
              {categories.map((cat, index) => (
                <Tab
                  key={cat.id}
                  icon={cat.name.includes("บ้าน") ? <WifiOutlinedIcon fontSize="small" /> : <SmartphoneOutlinedIcon fontSize="small" />}
                  iconPosition="start"
                  label={cat.name}
                  disableRipple
                  {...a11yProps(index)}
                  sx={{
                    borderColor: tabIndex === index ? "error.main" : "divider",
                    bgcolor: tabIndex === index ? "error.main" : "#fff",
                    color: tabIndex === index ? "#fff !important" : "text.primary",
                    "&:hover": {
                      borderColor: tabIndex === index ? "error.main" : "text.primary",
                      bgcolor: tabIndex === index ? "error.dark" : "#fafafa",
                    },
                  }}
                />
              ))}
            </Tabs>

            <Button
              href={getCategoryLink(activeCategory?.name)} 
              endIcon={<ArrowForwardIosIcon sx={{ fontSize: "14px !important" }} />}
              sx={{
                display: { xs: "none", md: "flex" },
                color: "error.main",
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              ดูโปรทั้งหมด
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ position: "relative" }}>
          <Box
            ref={scrollRef}
            onScroll={checkArrowVisibility}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          sx={{
            display: "flex",
            gap: { xs: 2, md: 3 },
            overflowX: "auto",
            pb: 4, 
            pt: 1, 
            px: { xs: 1, md: 0 },
            scrollSnapType: "x mandatory",
            cursor: "grab",
            "&:active": {
              cursor: "grabbing",
              scrollSnapType: "none",
            },
            "&::-webkit-scrollbar": {
              height: 6,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "background.default",
              borderRadius: 8,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "divider",
              borderRadius: 8,
              "&:hover": {
                backgroundColor: "text.secondary",
              },
            },
            msOverflowStyle: "auto",
            scrollbarWidth: "thin",
          }}
        >
          {filteredPackages.map((pkg, index) => (
            <Box
              key={`pkg-${pkg.id}`}
              component={motion.div}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              sx={{
                minWidth: { xs: "88%", sm: "45%", md: "31%", lg: "300px" },
                maxWidth: "340px",
                scrollSnapAlign: "start",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <PromoCard pkg={pkg} />
            </Box>
          ))}
        </Box>

        <AnimatePresence>
          {showRightArrow && filteredPackages.length > 0 && (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              sx={{
                position: "absolute",
                right: { xs: 8, md: 0 },
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                display: { xs: "flex", lg: "none" },
              }}
            >
              <IconButton
                onClick={() => {
                  if (scrollRef.current) {
                    const cardWidth = scrollRef.current.querySelector("div")?.clientWidth || 300;
                    scrollRef.current.scrollBy({ left: cardWidth + 24, behavior: "smooth" });
                  }
                }}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.95)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  width: 44,
                  height: 44,
                  color: "primary.main",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 1)",
                  },
                }}
              >
                <ArrowForwardIosIcon sx={{ fontSize: 18, ml: 0.5 }} />
              </IconButton>
            </Box>
          )}
        </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}

function PromoCard({ pkg }: { pkg: any }) {
  const { lineSupportUrl } = useSiteSettings();
  const header = useMemo(() => {
    const pName = pkg.name || "";
    if (pName.toLowerCase().includes("netflix")) {
      return {
        title: "Super Netflix",
        gradient: "linear-gradient(135deg, #ef4444 0%, #f97316 55%, #f59e0b 100%)",
      };
    }
    if (pName.toLowerCase().includes("youtube")) {
      return {
        title: "YouTube Premium",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #a855f7 55%, #ec4899 100%)",
      };
    }
    return {
      title: "แพ็กเกจแนะนำ",
      gradient: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #60a5fa 100%)",
    };
  }, [pkg.name]);

  const speedText = pkg.speed ? pkg.speed : null;

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        bgcolor: "background.paper",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        transition: "box-shadow 0.2s ease-in-out",
        "&:hover": {
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5, color: "#fff", backgroundImage: header.gradient }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography sx={{ fontWeight: 900, letterSpacing: 0.2 }}>
            {header.title}
          </Typography>
          {pkg.code ? (
            <Chip
              label={pkg.code}
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.92)",
                fontWeight: 900,
              }}
            />
          ) : null}
        </Stack>
      </Box>

      <CardContent
        sx={{
          p: 3,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 900,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            mb: 1.5,
          }}
        >
          {pkg.name}
        </Typography>

        <Stack
          direction="row"
          sx={{ mt: 1, alignItems: "flex-end", justifyContent: "space-between" }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 950, lineHeight: 1 }}>
              {speedText || formatPriceTHB(pkg.price)}
            </Typography>

            {pkg.details && (
              <Box sx={{ mt: 1 }}>
                {Array.isArray(pkg.details) ? (
                  <Stack spacing={0.5}>
                    {pkg.details.map((d: string, idx: number) => (
                      <Typography key={`detail-${idx}`} variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        • {d}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {pkg.details}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h5" sx={{ fontWeight: 950, color: "primary.main", lineHeight: 1 }}>
              {formatPriceTHB(pkg.price)}
              <Typography component="span" variant="body2" sx={{ fontWeight: 800, ml: 0.5 }}>
                บาท
              </Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, mt: 0.5 }}>
              / เดือน
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ flex: 1 }}>
          {pkg.imageUrl && (
            <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
              <img src={pkg.imageUrl} alt={pkg.name} style={{ maxHeight: "80px", objectFit: "contain" }} />
            </Box>
          )}

          {pkg.freebie && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 900, mb: 1.5 }}>
                รับทันที!
              </Typography>
              <Stack spacing={1.5}>
                {(Array.isArray(pkg.freebie) ? pkg.freebie : (typeof pkg.freebie === 'string' ? pkg.freebie.split(',') : [])).map((f: string, idx: number) => (
                  <Stack
                    key={`freebie-${idx}`}
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "flex-start" }}
                  >
                    <CheckCircleOutlineIcon sx={{ fontSize: 20, mt: "2px", color: "primary.main", flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ fontWeight: 650, color: "text.secondary", lineHeight: 1.4 }}>
                      {f.trim()}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Box>

        <Button
          fullWidth
          variant="contained"
          href={(pkg.buyUrl && pkg.buyUrl !== "#") ? pkg.buyUrl : lineSupportUrl}
          target="_blank"
          sx={{
            mt: 3,
            borderRadius: 999,
            py: 1.15,
            fontWeight: 800,
            backgroundImage: "linear-gradient(90deg, #3b82f6, #6366f1)",
            "&:hover": {
              backgroundImage: "linear-gradient(90deg, #2563eb, #4f46e5)",
            },
            boxShadow: "0 4px 14px 0 rgba(79, 70, 229, 0.3)",
          }}
        >
          สนใจสมัครบริการ
        </Button>
      </CardContent>
    </Card>
  );
}