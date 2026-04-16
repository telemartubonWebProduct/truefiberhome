"use client";

import { Box } from "@mui/material";
import HeroSection from "./components/HeroSection";
import HeaderBar from "./components/HeaderBar";
import Carousel from "./components/Carousel";
import PromotionSwiper from "./components/promotion-swiper";
import SalerService from "./components/saler-service";
import PackageOffers from "./components/PackageOffers";
import HomeInternet from "./components/HomeInternet";
import Banner from "./components/Banner";

interface HomePageClientProps {
  banners: any[];
  packages: any[];
  heroData: any;
  menuCategories: any[];
  agents: any[];
  homeSections: Record<string, any>;
}

export default function HomePageClient({
  banners,
  packages,
  heroData,
  menuCategories,
  agents,
  homeSections,
}: HomePageClientProps) {
  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Semantic landmark: skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>

      <HeaderBar menuCategories={menuCategories} />

      <div id="main-content">
        {/* Hero – contains the primary <h1> */}
        <HeroSection heroData={heroData} />

        {/* Promotion carousel slider for Banners */}
        {banners && banners.length > 0 && (
          <section aria-label="สไลด์แบนเนอร์">
            <Carousel banners={banners} />
          </section>
        )}

        {/* Package promotions swiper */}
        <section aria-label="โปรโมชันแนะนำ">
          <PromotionSwiper packages={packages} />
        </section>

        {/* Sales agent / service team */}
        <SalerService
          agents={agents}
          whyChooseData={homeSections?.whyChoose?.jsonData}
          processStepsData={homeSections?.processSteps?.jsonData}
        />

        {/* Add-on package offers */}
        <section aria-label="แพ็กเกจเสริมสำหรับคุณ">
          <PackageOffers
            topupData={homeSections?.packageOffersTopup?.jsonData}
            monthlyData={homeSections?.packageOffersMonthly?.jsonData}
          />
        </section>

        {/* Home internet section */}
        <section aria-label="บริการเน็ตบ้าน">
          <HomeInternet homeInternetData={homeSections?.homeInternet?.jsonData} />
        </section>

        {/* Promotional banner */}
        <section aria-label="แบนเนอร์โปรโมชัน">
          <Banner promoBannerData={homeSections?.promoBanner} />
        </section>
      </div>
    </Box>
  );
}
