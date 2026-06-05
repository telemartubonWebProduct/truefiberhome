import { Box, Stack, Typography, Button } from "@mui/material";
import type { Metadata } from "next";
import AutoLoopBanner from "./components/AutoLoopBanner";
import InstallPromotion from "./components/InstallPromotion";
import RevealText from "@/src/components/ui/RevealText";
import PromotionPresent from "./components/promotion-present";
import SalerService from "./components/saler-service";
import ContactSection from "./components/contact-section";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import { prisma } from "@/src/lib/prisma";
import { lineSupport } from "@/src/context/line-path";

export const metadata: Metadata = {
  title: "แพ็กเกจเน็ตบ้าน มือถือ และบริการติดตั้ง",
  description:
    "หน้าแรก True Fiber Home รวมแพ็กเกจเน็ตบ้าน ซิมมือถือ โปรโมชั่น และช่องทางสมัครบริการโดยทีมงานผู้เชี่ยวชาญ",
  alternates: { canonical: "/home" },
  openGraph: {
    title: "True Fiber Home | แพ็กเกจเน็ตบ้าน มือถือ และบริการติดตั้ง",
    description:
      "รวมแพ็กเกจยอดนิยมพร้อมช่องทางติดต่อที่ตรวจสอบได้ และข้อมูลนโยบายความเป็นส่วนตัวที่ชัดเจน",
    url: "/home",
    type: "website",
    images: [{ url: "/assets/Trueonline-logo.svg.png", width: 512, height: 512, alt: "True Fiber Home" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "True Fiber Home | แพ็กเกจเน็ตบ้าน มือถือ และบริการติดตั้ง",
    description: "รวมแพ็กเกจยอดนิยม พร้อมทีมงานดูแลและช่องทางสมัครที่ปลอดภัย",
    images: ["/assets/Trueonline-logo.svg.png"],
  },
};

export default async function HomePage() {
  const homeSectionDelegate = (prisma as any).homeSection;
  const bannerDelegate = (prisma as any).banner;
  const packageDelegate = (prisma as any).package;
  const contactMethodDelegate = (prisma as any).contactMethod;
  const agentDelegate = (prisma as any).agent;

  const [
    heroSection,
    installPromotionSection,
    promotionPresentSection,
    contactSection,
    banners,
    packages,
    contactMethods,
    agents,
  ] = await Promise.all([
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homeHeroVideo" } }) : null,
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homeInstallPromotion" } }) : null,
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homePromotionPresent" } }) : null,
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homeContactSection" } }) : null,
    bannerDelegate
      ? bannerDelegate.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } })
      : [],
    packageDelegate
      ? packageDelegate.findMany({ where: { status: true }, orderBy: { displayOrder: "asc" } })
      : [],
    contactMethodDelegate
      ? contactMethodDelegate.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } })
      : [],
    agentDelegate
      ? agentDelegate.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } })
      : [],
  ]);

  const fallbackTitle = "สัมผัสความเร็วเหนือระดับ กับเน็ตทรูไฟเบอร์";
  const fallbackSubtitle =
    "ลื่นไหล ไม่มีสะดุด ตอบโจทย์ทุกไลฟ์สไตล์ ทั้งทำงาน ดูหนัง เล่นเกม พร้อมเต็มอิ่มกับความบันเทิงระดับพรีเมียม";
  const fallbackVideoUrl = "/assets/mock-vid-main.mp4";

  const heroTitle = heroSection?.title || fallbackTitle;
  const heroSubtitle = heroSection?.subtitle || fallbackSubtitle;
  const heroVideoUrl = heroSection?.imageUrl || fallbackVideoUrl;
  const heroVisible = heroSection?.isActive ?? true;

  let buttonLabel = "สมัครเลยวันนี้";
  let buttonHref = lineSupport;

  if (heroSection?.jsonData && typeof heroSection.jsonData === "object" && !Array.isArray(heroSection.jsonData)) {
    const data = heroSection.jsonData as Record<string, unknown>;
    if (typeof data.buttonLabel === "string") buttonLabel = data.buttonLabel;
    if (typeof data.buttonHref === "string") {
      const normalizedHref = data.buttonHref.trim();
      if (normalizedHref && normalizedHref !== "/service" && normalizedHref !== "#") {
        buttonHref = normalizedHref;
      }
    }
  }

  const installTitle = installPromotionSection?.title || "ติดเน็ตทรูไฟเบอร์\nเร็ว แรง ครบทุกพื้นที่";
  const installTopLine = installPromotionSection?.subtitle || "สมัครง่าย ติดตั้งไว เริ่มต้นเพียง";
  const installIsActive = installPromotionSection?.isActive ?? true;

  let installPriceText = "499 บาท/เดือน";
  let installBottomLine = "ทีมงานดูแลครบ จบในที่เดียว";
  let installPrimaryButtonLabel = "ตรวจสอบพื้นที่ทางไลน์";
  let installPrimaryButtonHref = lineSupport;
  let installSecondaryButtonLabel = "ดูแพ็กเกจ";
  let installSecondaryButtonHref = "/home#packages";
  let installFooterText = "ติดตั้งทั่วไทย | ทีมงานมืออาชีพ | บริการรวดเร็ว";

  if (
    installPromotionSection?.jsonData &&
    typeof installPromotionSection.jsonData === "object" &&
    !Array.isArray(installPromotionSection.jsonData)
  ) {
    const data = installPromotionSection.jsonData as Record<string, unknown>;
    if (typeof data.priceText === "string") installPriceText = data.priceText;
    if (typeof data.bottomLine === "string") installBottomLine = data.bottomLine;
    if (typeof data.primaryButtonLabel === "string") installPrimaryButtonLabel = data.primaryButtonLabel;
    if (typeof data.primaryButtonHref === "string") {
      const normalizedHref = data.primaryButtonHref.trim();
      if (normalizedHref && normalizedHref !== "/service" && normalizedHref !== "#") {
        installPrimaryButtonHref = normalizedHref;
      }
    }
    if (typeof data.secondaryButtonLabel === "string") installSecondaryButtonLabel = data.secondaryButtonLabel;
    if (typeof data.secondaryButtonHref === "string" && data.secondaryButtonHref.trim()) {
      installSecondaryButtonHref = data.secondaryButtonHref;
    }
    if (typeof data.footerText === "string") installFooterText = data.footerText;
  }

  const promotionPresentHelperText = promotionPresentSection?.subtitle || "เลื่อนเพื่อดูโปรโมชันทั้งหมด";
  const promotionPresentVisible = promotionPresentSection?.isActive ?? true;

  const mapGiftImage = (label: string) => {
    const text = label.toLowerCase();
    if (text.includes("router")) return "/assets/gifts/router.webp";
    if (text.includes("ติดตั้ง") || text.includes("install")) return "/assets/gifts/install.webp";
    if (text.includes("mesh")) return "/assets/gifts/mesh.webp";
    return undefined;
  };

  const getFreebieItems = (value: unknown) => {
    const items: Array<{ label: string; imageUrl?: string }> = [];

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") {
          const label = item.trim();
          if (label) items.push({ label });
          return;
        }

        if (item && typeof item === "object" && !Array.isArray(item)) {
          const data = item as Record<string, unknown>;
          const labelRaw = data.label ?? data.text ?? data.name;
          const imageRaw = data.imageUrl ?? data.image;
          const label = typeof labelRaw === "string" ? labelRaw.trim() : "";
          const imageUrl = typeof imageRaw === "string" ? imageRaw : undefined;
          if (label) items.push({ label, imageUrl });
        }
      });

      return items;
    }

    if (typeof value === "string" && value.trim()) {
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((label) => items.push({ label }));

      return items;
    }

    return items;
  };

  const promotionPackages = (packages as any[]).map((pkg, index) => {
    const freebieItems = getFreebieItems(pkg.freebie);
    const freebies = freebieItems.map((item) => item.label);
    const priceNumber = Number(pkg.price ?? 0);

    return {
      id: pkg.id ?? `pkg-${index}`,
      tag: pkg.code || `Package ${index + 1}`,
      name: pkg.name || "แพ็กเกจมาตรฐาน",
      speed: pkg.speed || "-",
      price: Number.isFinite(priceNumber)
        ? Number.isInteger(priceNumber)
          ? String(priceNumber)
          : priceNumber.toFixed(2)
        : "0",
      freebies,
      gifts: freebieItems.map((item) => ({
        label: item.label,
        image: item.imageUrl || mapGiftImage(item.label),
      })),
      buyUrl:
        typeof pkg.buyUrl === "string" && pkg.buyUrl.trim() && pkg.buyUrl.trim() !== "/service" && pkg.buyUrl.trim() !== "#"
          ? pkg.buyUrl.trim()
          : lineSupport,
    };
  });

  const autoLoopBanners = (banners as any[]).map((banner, index) => ({
    id: banner.id ?? `banner-${index}`,
    title: typeof banner.title === "string" ? banner.title : null,
    description: typeof banner.description === "string" ? banner.description : null,
    imageUrl: typeof banner.imageUrl === "string" ? banner.imageUrl : null,
  }));

  const contactTitle = contactSection?.title || "ติดต่อและสมัครบริการ";
  const contactSubtitle = contactSection?.subtitle || "เลือกช่องทางที่สะดวก ทีมงานพร้อมดูแลทันที";
  const contactVisible = contactSection?.isActive ?? true;
  const contactSectionId = "home-contact-section";

  const ctaIcon = (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: { xs: 32, sm: 36 },
        height: { xs: 32, sm: 36 },
        borderRadius: "999px",
        bgcolor: "rgba(255,255,255,0.2)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)",
        backdropFilter: "blur(6px)",
      }}
    >
      <PhoneIphoneIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
    </Box>
  );

  const displayContactMethods = (contactMethods as any[]).map((item, index) => ({
    id: item.id ?? `contact-${index}`,
    key: typeof item.key === "string" ? item.key : "phone",
    title: typeof item.title === "string" ? item.title : "ช่องทางติดต่อ",
    desc: typeof item.description === "string" ? item.description : "ติดต่อทีมงานของเราได้ทันที",
    href:
      typeof item.href === "string" && item.href.trim() && item.href.trim() !== "/service" && item.href.trim() !== "#"
        ? item.href.trim()
        : lineSupport,
    iconUrl: typeof item.iconUrl === "string" ? item.iconUrl : null,
    colorClass: typeof item.colorClass === "string" ? item.colorClass : null,
  }));

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#ffffff",
          p: { xs: 1, md: 2 },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={{ xs: 1, md: 2 }}
          sx={{ flex: 1, mt: { xs: 8, lg: 0 }, minHeight: "80vh" }}
        >
          {heroVisible && (
            <Box
              sx={{
                flex: 1,
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                minHeight: { xs: 400, lg: "auto" },
              }}
            >
              <Box
                component="video"
                src={heroVideoUrl}
                autoPlay
                muted
                loop
                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />

              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.45)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  p: { xs: 3, sm: 4, md: 6 },
                }}
              >
                <Box
                  sx={{
                    maxWidth: { xs: "20rem", sm: "28rem", md: "34rem" },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: { xs: 2, md: 3 },
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      textShadow: "0px 4px 10px rgba(0,0,0,0.3)",
                      fontSize: { xs: "1.9rem", sm: "2.4rem", md: "3rem" },
                      lineHeight: { xs: 1.2, md: 1.15 },
                    }}
                  >
                    {heroTitle}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "rgba(255, 255, 255, 0.9)",
                      fontWeight: 400,
                      lineHeight: { xs: 1.6, md: 1.7 },
                      fontSize: { xs: "0.95rem", sm: "1.05rem", md: "1.15rem" },
                    }}
                  >
                    {heroSubtitle}
                  </Typography>
                  <Button
                    component="a"
                    href={buttonHref}
                    variant="contained"
                    disableElevation
                    sx={{
                      borderRadius: "999px",
                      px: { xs: 2.75, sm: 3.5 },
                      py: { xs: 1.1, sm: 1.35 },
                      fontSize: { xs: "0.95rem", sm: "1.05rem" },
                      fontWeight: 700,
                      letterSpacing: "0.01em",
                      textTransform: "none",
                      width: { xs: "100%", sm: "auto" },
                      maxWidth: { xs: "18rem", sm: "none" },
                      justifyContent: "center",
                      gap: 1,
                      color: "#fff",
                      backgroundImage: "linear-gradient(135deg, #ff3b3b 0%, #ff6b4a 45%, #ff9a5a 100%)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      boxShadow: "0px 10px 28px rgba(255, 59, 59, 0.45)",
                      position: "relative",
                      overflow: "hidden",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: "1px",
                        borderRadius: "999px",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0))",
                        opacity: 0.5,
                      },
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0px 14px 36px rgba(255, 59, 59, 0.6)",
                        filter: "brightness(1.05)",
                      },
                      "&:active": {
                        transform: "translateY(-1px)",
                      },
                      "& .MuiButton-endIcon": {
                        marginLeft: "0.6rem",
                      },
                    }}
                    endIcon={ctaIcon}
                  >
                    {buttonLabel}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          <Stack spacing={{ xs: 1, md: 2 }} sx={{ flex: 1 }}>
            <AutoLoopBanner banners={autoLoopBanners} />
            <InstallPromotion
              content={{
                title: installTitle,
                topLine: installTopLine,
                priceText: installPriceText,
                bottomLine: installBottomLine,
                primaryButtonLabel: installPrimaryButtonLabel,
                primaryButtonHref: installPrimaryButtonHref,
                secondaryButtonLabel: installSecondaryButtonLabel,
                secondaryButtonHref: installSecondaryButtonHref,
                footerText: installFooterText,
                isActive: installIsActive,
              }}
            />
          </Stack>
        </Stack>
      </Box>

      {promotionPresentVisible && (
        <Box sx={{ py: 15, px: { xs: 4, md: 10 }, bgcolor: "white" }}>
          <RevealText text="สัมผัสความเร็วเหนือระดับ. กับโปรโมชันเน็ตบ้านที่ดีที่สุดสำหรับคุณ." />
          <PromotionPresent
            packages={promotionPackages}
            helperText={promotionPresentHelperText}
            isActive={promotionPresentVisible}
            contactSectionId={contactSectionId}
            contactMethods={displayContactMethods}
          />
        </Box>
      )}

      <SalerService agents={agents as any[]} />
      <ContactSection
        sectionId={contactSectionId}
        content={{
          title: contactTitle,
          subtitle: contactSubtitle,
          isActive: contactVisible,
        }}
        methods={displayContactMethods}
      />
   
     
    
    </>
  );
}
