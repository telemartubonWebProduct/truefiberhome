// app/layout.tsx (TypeScript) หรือ app/layout.jsx (JavaScript)
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/src/components/layout/Navbar";
import BottomNav from "@/src/components/layout/BottomNav";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { Analytics } from "@vercel/analytics/next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.truefiberhome.com";

// ยิง analytics เฉพาะ production deploy (โดเมนหลัก) เท่านั้น
// VERCEL_ENV: 'production' | 'preview' | 'development'
const isProductionDeploy = process.env.VERCEL_ENV === "production";

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    default: "True Fiber Home | เน็ตบ้าน มือถือ โซล่าเซลล์",
    template: "%s | True Fiber Home",
  },
  description:
    "True Fiber Home ให้บริการ เน็ตบ้านทรูออนไลน์ ซิมมือถือทรู-ดีแทค แพ็กเกจความบันเทิง โซล่าเซลล์ครบวงจร และอุปกรณ์ไอที พร้อมช่องทางติดต่อที่ตรวจสอบได้",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/home",
  },
  keywords: [
    "เน็ตทรูไฟเบอร์",
    "เน็ตบ้านทรู",
    "สมัครเน็ตทรู",
    "ติดตั้งเน็ตบ้าน",
    "โปรเน็ตทรู",
    "True Fiber Home",
    "บริการอินเทอร์เน็ตอุบลราชธานี",
  ],
  authors: [{ name: "True Fiber Home" }],
  creator: "True Fiber Home",
  publisher: "True Fiber Home",
  category: "telecommunications",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    siteName: "True Fiber Home",
    locale: "th_TH",
    type: "website",
    title: "True Fiber Home | เน็ตบ้าน มือถือ โซล่าเซลล์",
    description:
      "สมัครเน็ตบ้านทรูออนไลน์ แพ็กเกจมือถือ และบริการติดตั้งครบวงจร โดยทีมผู้เชี่ยวชาญ พร้อมช่องทางติดต่อที่ตรวจสอบได้",
    url: `${siteUrl}/home`,
    images: [
      {
        url: "/assets/Trueonline-logo.svg.png",
        width: 512,
        height: 512,
        alt: "True Fiber Home",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "True Fiber Home | เน็ตบ้าน มือถือ โซล่าเซลล์",
    description:
      "แพ็กเกจอินเทอร์เน็ตและบริการติดตั้งโดยทีมงานมืออาชีพ พร้อมนโยบายความเป็นส่วนตัวและมาตรการป้องกันการหลอกลวง",
  },
};

import { ThemeProvider } from "@mui/material/styles";
import theme from "@/src/theme/theme";
import Footer from "@/src/components/layout/Footer";
import ScrollToTop from "@/src/components/layout/ScrollToTop";
import CookieConsent from "@/src/components/layout/CookieConsent";
import { prisma } from "@/src/lib/prisma";
import { SiteSettingsProvider } from "@/src/context/SiteSettingsContext";
import ChatWidgetVisibility from "@/src/components/chat/ChatWidgetVisibility";
import ConsentAnalytics from "@/src/components/analytics/ConsentAnalytics";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigationItemDelegate = (prisma as any).navigationItem;
  const footerLinkDelegate = (prisma as any).footerLink;

  // ดึงข้อมูลแบบทนทาน: ถ้า DB ต่อไม่ได้ ให้ fallback แทนการ 500 ทั้งหน้า
  // (Navbar/Footer มีเมนูสำรองรองรับค่าว่างอยู่แล้ว)
  const onDbError = (label: string) => (error: unknown) => {
    console.error(`[layout] ดึง ${label} จากฐานข้อมูลไม่สำเร็จ ใช้ค่าสำรองแทน:`, error);
    return null;
  };

  const [siteSettings, navigationItems, footerLinks] = await Promise.all([
    prisma.siteSettings
      .findUnique({ where: { id: "singleton" } })
      .catch(onDbError("siteSettings")),
    navigationItemDelegate
      ? navigationItemDelegate
          .findMany({
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          })
          .catch(onDbError("navigationItems"))
      : Promise.resolve([]),
    footerLinkDelegate
      ? footerLinkDelegate
          .findMany({
            where: { isActive: true },
            orderBy: [
              { section: "asc" },
              { displayOrder: "asc" },
              { createdAt: "asc" },
            ],
          })
          .catch(onDbError("footerLinks"))
      : Promise.resolve([]),
  ]);

  return (
    // 2) เพิ่ม className จากตัวแปร prompt.className ตรงแท็ก html หรือ body
    <html lang="th" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "True Fiber Home",
              url: siteUrl,
              logo: `${siteUrl}/assets/Trueonline-logo.svg.png`,
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  telephone: siteSettings?.phone || "0910192552",
                  areaServed: "TH",
                  availableLanguage: ["th", "en"],
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        <SiteSettingsProvider
          settings={{
            lineSupportUrl: siteSettings?.lineSupportUrl || undefined,
          }}
        >
          <AppRouterCacheProvider>
            <CookieConsent />
            <ThemeProvider theme={theme}>
              <a className="skip-link" href="#main-content">
                ข้ามไปยังเนื้อหาหลัก
              </a>
              <div className="min-h-screen flex flex-col">
                <Navbar
                  siteSettings={siteSettings}
                  navigationItems={navigationItems}
                />
                <ScrollToTop />
                <main id="main-content" className="flex-1 pb-[65px] lg:pb-0">
                  {children}
                </main>
                <Footer siteSettings={siteSettings} footerLinks={footerLinks} />
                <BottomNav />
              </div>
              {isProductionDeploy ? <Analytics /> : null}
              {isProductionDeploy ? <ConsentAnalytics /> : null}
              <ChatWidgetVisibility />
            </ThemeProvider>
          </AppRouterCacheProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
