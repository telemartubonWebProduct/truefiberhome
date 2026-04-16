"use client";
import { Box, Button, Container, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { heroContent as defaultHero } from "@/src/data/home";
import { useSiteSettings } from "@/src/context/SiteSettingsContext";

const MotionBox = motion(Box);

const heroVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: "easeOut", staggerChildren: 0.15 },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0 },
};

interface HeroSectionProps {
  heroData?: {
    tagline?: string | null;
    rotatingTexts?: string[];
    titlePrefix?: string | null;
    description?: string | null;
    ctaPrimaryLabel?: string | null;
    ctaPrimaryHref?: string | null;
    ctaSecondaryLabel?: string | null;
    ctaSecondaryHref?: string | null;
    backgroundImageUrl?: string | null;
  } | null;
}

export default function HeroSection({ heroData }: HeroSectionProps) {
  const isExternalLink = (href?: string | null) => !!href && /^https?:\/\//i.test(href);
  const { lineSupportUrl } = useSiteSettings();

  // Merge DB data with static defaults
  const tagline = heroData?.tagline ?? defaultHero.tagline;
  const texts: string[] =
    heroData?.rotatingTexts && heroData.rotatingTexts.length > 0
      ? heroData.rotatingTexts
      : defaultHero.rotatingTexts;
  const titlePrefix = heroData?.titlePrefix ?? defaultHero.titlePrefix;
  const description = heroData?.description ?? defaultHero.description;
  const ctaPrimaryLabel = heroData?.ctaPrimaryLabel ?? defaultHero.ctaPrimary.label;
  const ctaPrimaryHref = heroData?.ctaPrimaryHref ?? defaultHero.ctaPrimary.href;
  const ctaSecondaryLabel = heroData?.ctaSecondaryLabel ?? defaultHero.ctaSecondary.label;
  const ctaSecondaryHref = heroData?.ctaSecondaryHref ?? defaultHero.ctaSecondary.href;
  const backgroundImage = heroData?.backgroundImageUrl ?? defaultHero.backgroundImage;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = texts[currentIndex];
    const typingSpeed = 50;
    const deletingSpeed = 70;
    const pauseTime = 1500;

    let timer: NodeJS.Timeout;

    if (!isDeleting && displayText.length < fullText.length) {
      timer = setTimeout(() => {
        setDisplayText(fullText.slice(0, displayText.length + 1));
      }, typingSpeed);
    } else if (!isDeleting && displayText.length === fullText.length) {
      timer = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && displayText.length > 0) {
      timer = setTimeout(() => {
        setDisplayText(fullText.slice(0, displayText.length - 1));
      }, deletingSpeed);
    } else if (isDeleting && displayText.length === 0) {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentIndex, texts]);

  return (
    <Box
      component="section"
      className="relative flex items-center justify-center overflow-hidden"
      sx={{
        minHeight: { xs: "70vh", md: "90vh" },
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* overlay */}
      <Box className="absolute inset-0 bg-gradient-to-b from-black/40 via-red-950/80 to-black/95" />

      {/* glow effects */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.8, x: -40 }}
        animate={{ opacity: 0.9, scale: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-red-500/25 blur-3xl"
      />
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.8, x: 40 }}
        animate={{ opacity: 0.9, scale: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl"
      />

      <Container maxWidth="lg" className="relative z-10">
        <MotionBox initial="hidden" animate="visible" className="max-w-2xl space-y-6">
          <Typography
            variants={childVariants}
            component={motion.p}
            variant="overline"
            className="tracking-[0.25em] text-red-400"
          >
            {tagline}
          </Typography>

          <Typography
            variants={childVariants}
            component={motion.h1}
            variant="h2"
            className="font-semibold leading-tight text-white drop-shadow-md"
            sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem", lg: "3.5rem" } }}
          >
            {titlePrefix}{" "}
            <span className="relative bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
              {displayText}
              <span className="absolute -bottom-1 left-0 h-[2px] w-6 animate-pulse rounded-full bg-amber-300" />
            </span>
          </Typography>

          <Typography
            variants={childVariants}
            component={motion.p}
            variant="body1"
            className="max-w-xl text-base text-slate-100/80 md:text-lg"
          >
            {description}
          </Typography>

          <Box component={motion.div} variants={childVariants} className="mt-6 flex flex-wrap items-center gap-4">
            <Button
              component={motion.button}
              animate={{
                boxShadow: [
                  "0 18px 45px rgba(239,68,68,0.55)",
                  "0 24px 55px rgba(248,113,113,0.9)",
                  "0 18px 45px rgba(239,68,68,0.55)",
                ],
                scale: [1, 1.04, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              variant="contained"
              onClick={() => {
                const finalHref = (!ctaPrimaryHref || ctaPrimaryHref === "#") ? lineSupportUrl : ctaPrimaryHref;
                if (finalHref) {
                  if (isExternalLink(finalHref)) window.open(finalHref, "_blank", "noopener,noreferrer");
                  else window.location.href = finalHref;
                }
              }}
              className="rounded-full px-8 py-2 text-sm font-semibold uppercase tracking-wide shadow-lg shadow-red-500/40"
              sx={{
                backgroundImage: "linear-gradient(90deg, #f97316, #ef4444, #fb923c)",
                "&:hover": { backgroundImage: "linear-gradient(90deg, #fecaca, #fb923c, #f97316)" },
              }}
            >
              {ctaPrimaryLabel}
            </Button>
            <Box>
              <Button
                component={motion.button}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                variant="outlined"
                onClick={() => {
                  const finalHref = (!ctaSecondaryHref || ctaSecondaryHref === "#") ? lineSupportUrl : ctaSecondaryHref;
                  if (finalHref) {
                    if (isExternalLink(finalHref)) window.open(finalHref, "_blank", "noopener,noreferrer");
                    else window.location.href = finalHref;
                  }
                }}
                className="rounded-full px-8 py-2 text-sm font-semibold uppercase tracking-wide shadow-md"
                sx={{
                  borderColor: "rgba(255,255,255,0.6)",
                  color: "rgba(255,255,255,0.8)",
                  "&:hover": { borderColor: "rgba(255,255,255,0.9)", backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" },
                }}
              >
                {ctaSecondaryLabel}
              </Button>
            </Box>
          </Box>
        </MotionBox>
      </Container>

      {/* gradient bottom */}
      <Box className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-red-950/80 to-transparent" />
    </Box>
  );
}
