// app/layout.tsx (TypeScript) หรือ app/layout.jsx (JavaScript)
import "./globals.css";
import { Prompt } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Navbar from "@/src/components/layout/Navbar";
import BottomNav from "@/src/components/layout/BottomNav";
import { ToastContainer } from "react-toastify";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";


// 1) เรียกใช้ฟอนต์ Prompt จาก next/font/google
const prompt = Prompt({
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-prompt",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truefiberhome.com";



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
    images: [{ url: "/assets/Trueonline-logo.svg.png", width: 512, height: 512, alt: "True Fiber Home" }],
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
import N8nChat from "@/src/components/N8nChat";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigationItemDelegate = (prisma as any).navigationItem;
  const footerLinkDelegate = (prisma as any).footerLink;

  const [siteSettings, navigationItems, footerLinks] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    navigationItemDelegate
      ? navigationItemDelegate.findMany({
          where: { isActive: true },
          orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        })
      : [],
    footerLinkDelegate
      ? footerLinkDelegate.findMany({
          where: { isActive: true },
          orderBy: [{ section: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
        })
      : [],
  ]);

  return (
    // 2) เพิ่ม className จากตัวแปร prompt.className ตรงแท็ก html หรือ body
    <html lang="th" className={prompt.className} suppressHydrationWarning>
      <head>
        

        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18007307609"
          strategy="afterInteractive"
        />
       


        <Script
          id="structured-data-organization"
          type="application/ld+json"
          strategy="afterInteractive"
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
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('consent', 'default', {
                ad_storage: 'denied',
                analytics_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                wait_for_update: 500
              });
              gtag('config', 'AW-18007307609', { anonymize_ip: true });
            `,
          }}
        />
        <Script
          id="gtm-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PGGH95T3');`,
          }}
        />
      </head>
      <body>

        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PGGH95T3"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <SiteSettingsProvider settings={{ lineSupportUrl: siteSettings?.lineSupportUrl || undefined }}>
          <AppRouterCacheProvider>
            <CookieConsent />
            <ThemeProvider theme={theme}>
              <div className="min-h-screen flex flex-col">
                <Navbar siteSettings={siteSettings} navigationItems={navigationItems} />
                <ScrollToTop />
                <main className="flex-1 pb-[65px] lg:pb-0">{children}</main>
                <Footer siteSettings={siteSettings} footerLinks={footerLinks} />
                <BottomNav />
              </div>
              <ToastContainer position="bottom-right" theme="dark"  />
              <N8nChat webhookUrl={process.env.N8N_WEBHOOK_URL || ""} />
            </ThemeProvider>
          </AppRouterCacheProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
