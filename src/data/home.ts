import type { MenuItem, HeroContent, SlideData, BannerData } from "@/src/types/content";

// ===== Menu Items (HeaderBar) =====
export const menuItems: MenuItem[] = [
  { src: "/assets/Icon/ico-package.svg", alt: "แพ็กเกจมือถือ", text: "แพ็กเกจมือถือ", path: "/topup" },
  { src: "/assets/Icon/ico-true-online.svg", alt: "แพ็กเกจเน็ตบ้าน", text: "แพ็กเกจเน็ตบ้าน", path: "/boardband" },
  { src: "/assets/Icon/ico-entertainment.svg", alt: "แพ็กเกจความบันเทิง", text: "แพ็กเกจความบันเทิง", path: "/monthly#entertainment" },
  { src: "/assets/Icon/ico-lifestyle.svg", alt: "ไลฟ์สไตล์", text: "ไลฟ์สไตล์", path: "/monthly#game" },
  { src: "/assets/Icon/ico-smart-living.svg", alt: "พลังงานทางเลือก", text: "พลังงานทางเลือก", path: "/wEnergy" },
];

// ===== Hero Section =====
export const heroContent: HeroContent = {
  tagline: "TRUE TELEMART COMMUNICATION",
  rotatingTexts: [
    "อินเทอร์เน็ต ทรู x ดีแทค",
    "เครือข่ายสัญญาณมือถือ",
    "โซล่าเซลล์ครบวงจร",
  ],
  titlePrefix: "ที่สุดของ",
  description:
    "สัมผัสประสบการณ์การเชื่อมต่อที่เหนือกว่าด้วยอินเทอร์เน็ตความเร็วสูงจากทรู เร็ว แรง เสถียร ครอบคลุมทุกพื้นที่ทั่วไทย ตอบโจทย์ทุกไลฟ์สไตล์การใช้งาน ทั้งทำงาน เล่นเกม และความบันเทิงแบบไร้ขีดจำกัด",
  ctaPrimary: { label: "ติดต่อทีมของเรา", href: "#" },
  ctaSecondary: { label: "ดูบริการทั้งหมด", href: "#" },
  backgroundImage: "/assets/banner/hero-banner.jpg",
};

// ===== Carousel Slides =====
export const carouselSlides: SlideData[] = [
  { id: 1, image: "/assets/packages/package1.webp", alt: "แพ็กเกจโปรโมชัน True Telemart ชุดที่ 1" },
  { id: 2, image: "/assets/packages/package2.webp", alt: "แพ็กเกจโปรโมชัน True Telemart ชุดที่ 2" },
  { id: 3, image: "/assets/packages/package3.webp", alt: "แพ็กเกจโปรโมชัน True Telemart ชุดที่ 3" },
  { id: 4, image: "/assets/packages/package4.webp", alt: "แพ็กเกจโปรโมชัน True Telemart ชุดที่ 4" },
  { id: 5, image: "/assets/packages/package5.webp", alt: "แพ็กเกจโปรโมชัน True Telemart ชุดที่ 5" },
];

export const carouselSlidesMobile: SlideData[] = [
  { id: 1, image: "/assets/packagesMobileScreen/package1.webp" },
  { id: 2, image: "/assets/packagesMobileScreen/package2.webp" },
  { id: 3, image: "/assets/packagesMobileScreen/package3.webp" },
  { id: 4, image: "/assets/packagesMobileScreen/package4.webp" },
  { id: 5, image: "/assets/packagesMobileScreen/package5.webp" },
];

// ===== Banner =====
export const bannerImage: BannerData = {
  id: 1,
  image: "/assets/etc/BannerTrue.webp",
  alt: "โปรโมชันพิเศษ True Telemart – สมัครเน็ตบ้าน มือถือ และบริการดิจิทัลครบวงจร",
};
