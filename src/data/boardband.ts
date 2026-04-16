import type { PackageItem } from "@/src/types/package";
import type { ResponsiveSlideData } from "@/src/types/content";

export const broadbandCarouselData: ResponsiveSlideData[] = [
  { id: 1, desktopImage: "/assets/packages/package1.webp", mobileImage: "/assets/packagesMobileScreen/package1.webp", alt: "แพ็กเกจโปรโมชัน True Telemart ชุดที่ 1" },
  { id: 2, desktopImage: "/assets/packages/package2.webp", mobileImage: "/assets/packagesMobileScreen/package2.webp", alt: "แพ็กเกจโปรโมชัน True Telemart ชุดที่ 2" },
  { id: 3, desktopImage: "/assets/packages/package3.webp", mobileImage: "/assets/packagesMobileScreen/package3.webp", alt: "แพ็กเกจโปรโมชัน True Telemart ชุดที่ 3" },
  { id: 4, desktopImage: "/assets/packages/package4.webp", mobileImage: "/assets/packagesMobileScreen/package4.webp", alt: "แพ็กเกจโปรโมชัน True Telemart ชุดที่ 4" },
  { id: 5, desktopImage: "/assets/packages/package5.webp", mobileImage: "/assets/packagesMobileScreen/package5.webp", alt: "แพ็กเกจโปรโมชัน True Telemart ชุดที่ 5" },
];

export const broadbandPackageData: PackageItem[] = [
  {
    id: 101, category_id: 1, name: "Super Netflix Basic 999", price: 999,
    highlight_price: 799, download_speed: 1000, upload_speed: 500,
    speed_unit: "Mbps", contract_months: 24, promo_badge: "แนะนำ🔥",
    perks: [
      { text: "True Gigatex Fiber Router WiFi6", imageUrl: "/images/router-icon.png" },
      { text: "TrueIDTV GEN 3 พร้อม App AI Fitness & Game", imageUrl: "/images/trueid-icon.png" },
      { text: "สิทธิ์รับชม Netflix Basic Plan", imageUrl: "/images/netflix-icon.png" },
      { text: "TrueID+ นาน 12 เดือน", imageUrl: "/images/trueid-plus-icon.png" },
    ],
    buy_link: "#", display_order: 1, is_active: true, header_theme: "netflix",
  },
  {
    id: 102, category_id: 1, name: "YouTube Premium", price: 629,
    download_speed: 500, upload_speed: 500, speed_unit: "Mbps", contract_months: 24,
    perks: [{ text: "True Gigatex Fiber Router WiFi6" }, { text: "YouTube Premium" }, { text: "YouTube Music" }],
    buy_link: "#", display_order: 2, is_active: true, header_theme: "youtube",
  },
  {
    id: 103, category_id: 1, name: "Asian Content Lover 599", price: 599,
    download_speed: 500, upload_speed: 500, speed_unit: "Mbps", contract_months: 24,
    perks: [
      { text: "True Gigatex Fiber Router WiFi6" }, { text: "TrueIDTV GEN 3" },
      { text: "AI Fitness ทดลองใช้ฟรี 30 วัน" }, { text: "AI Game ทดลองใช้ฟรี 30 วัน" },
      { text: "iQIYI 24 เดือน" },
    ],
    freebies: [{ text: "รับฟรี อุปกรณ์พิเศษรับสัญญาณมือถือ สลับสัญญาณอัตโนมัติ" }],
    buy_link: "#", display_order: 3, is_active: true, header_theme: "generic",
  },
  {
    id: 104, category_id: 1, name: "TrueOnline 500/500", price: 499,
    download_speed: 500, upload_speed: 500, speed_unit: "Mbps", contract_months: 24,
    perks: [], freebies: [{ text: "เราเตอร์ WiFi 6 เน็ตแรงครอบคลุมกว่าเดิม" }],
    buy_link: "#", display_order: 4, is_active: true, header_theme: "generic",
  },
  {
    id: 105, category_id: 1, name: "Asian Content Lover 599", price: 599,
    download_speed: 500, upload_speed: 500, speed_unit: "Mbps", contract_months: 24,
    perks: [
      { text: "True Gigatex Fiber Router WiFi6" }, { text: "TrueIDTV GEN 3" },
      { text: "AI Fitness ทดลองใช้ฟรี 30 วัน" }, { text: "AI Game ทดลองใช้ฟรี 30 วัน" },
      { text: "iQIYI 24 เดือน" },
    ],
    freebies: [{ text: "รับฟรี อุปกรณ์พิเศษรับสัญญาณมือถือ สลับสัญญาณอัตโนมัติ" }],
    buy_link: "#", display_order: 3, is_active: true, header_theme: "generic",
  },
  {
    id: 106, category_id: 1, name: "TrueOnline 500/500", price: 499,
    download_speed: 500, upload_speed: 500, speed_unit: "Mbps", contract_months: 24,
    perks: [], freebies: [{ text: "เราเตอร์ WiFi 6 เน็ตแรงครอบคลุมกว่าเดิม" }],
    buy_link: "#", display_order: 4, is_active: true, header_theme: "generic",
  },
];
