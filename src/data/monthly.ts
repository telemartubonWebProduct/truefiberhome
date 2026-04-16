import type { PackageCategory, PackageItem, PromotionItem } from "@/src/types/package";
import type { BannerData } from "@/src/types/content";

// ===== Monthly Banners =====
export const monthlyBanner: BannerData[] = [
  { id: 1, image: "/assets/monthy/monthybanner_desktop.webp" },
];

export const monthlyBannerMobile: BannerData[] = [
  { id: 1, image: "/assets/monthy/monthybanner_mobile.webp" },
];

// ===== Monthly Categories =====
export const monthlyCategories: PackageCategory[] = [
  { id: 1, name: "เน็ตเพิ่มสปีด", slug: "speed" },
  { id: 2, name: "เน็ตไม่จำกัด", slug: "unlimited" },
  { id: 3, name: "เน็ตเล่นโซเซียล", slug: "social" },
  { id: 4, name: "โทร", slug: "call" },
  { id: 5, name: "ซีรีส์ & เอนเตอร์เทนเมนท์", slug: "entertainment" },
  { id: 6, name: "ความคุ้มครอง", slug: "insurance" },
  { id: 7, name: "เกม & ไลฟ์สไตล์", slug: "game" },
];

// ===== Monthly Packages =====
export const monthlyPackages: PackageItem[] = [
  {
    id: 1, category_id: 1,
    name: "เน็ตเพิ่มสปีด 60GB 399บาท นาน 30วัน",
    price: 399, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "เน็ตเต็มสปีด 60 GB", imageUrl: "speed" },
      { text: "ใช้งานได้ 30 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 2, category_id: 1,
    name: "เน็ตเพิ่มสปีด 50GB 349บาท นาน 30วัน",
    price: 349, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "เน็ตเต็มสปีด 50 GB", imageUrl: "speed" },
      { text: "ใช้งานได้ 30 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 3, category_id: 2,
    name: "เน็ตเต็มสปีดไม่อั้น 199บาท นาน 7วัน",
    price: 199, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "เน็ตเต็มสปีด ไม่จำกัด", imageUrl: "wifi" },
      { text: "ใช้งานได้ 7 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 4, category_id: 3,
    name: "เน็ต YouTube ไม่อั้น 179บาท นาน 30วัน",
    price: 179, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "ไม่อั้นสำหรับ YouTube", imageUrl: "tv" },
      { text: "ใช้งานได้ 30 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 5, category_id: 4,
    name: "โทร 200 นาที 199 บาท นาน 30 วัน",
    price: 199, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "โทรฟรีทุกเครือข่าย 200 นาที", imageUrl: "phone" },
      { text: "ใช้งานได้ 30 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 6, category_id: 5,
    name: "แพ็กเกจ Asian Combo (Viu, iQIYI, WeTV)",
    price: 399, price_note: "(รวม VAT)", is_active: true,
    perks: [
      { text: "ดูซีรีส์ไม่อั้น 3 แอปดัง", imageUrl: "tv" },
      { text: "โทรฟรี 100 นาที", imageUrl: "phone" },
      { text: "ใช้งานได้ 30 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 7, category_id: 6,
    name: "ประกันชีวิตคุ้มครองสะสม 100,000 บาท",
    price: 499, price_note: "(รวม VAT)", is_active: true,
    perks: [
      { text: "คุ้มครองสูงสุด 100,000 บาท", imageUrl: "insurance" },
      { text: "ใช้งานได้ 30 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 8, category_id: 7,
    name: "เน็ตเล่นเกม ROV, FreeFire ไม่อั้น",
    price: 299, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "เล่นเกมดังไม่เสียค่าเน็ต", imageUrl: "game" },
      { text: "รับไอเทมเกมสุดพิเศษ", imageUrl: "game" },
      { text: "ใช้งานได้ 30 วัน", imageUrl: "calendar" },
    ],
  },
];

// ===== Monthly Banner Promotions =====
export const PromotionMonthyUpspeed: PromotionItem[] = [
  { id: 1, title: "เน็ตเพิ่มสปีด 60GB 399บาท นาน 30วัน", validity: "30 วัน", speed: "60 GB", price: 399, vat: "ไม่รวม VAT" },
  { id: 2, title: "เน็ตเพิ่มสปีด 50GB 349บาท นาน 30วัน", validity: "30 วัน", speed: "50 GB", price: 349, vat: "ไม่รวม VAT" },
  { id: 3, title: "เน็ตเพิ่มสปีด 35GB 299บาท นาน 15วัน", validity: "15 วัน", speed: "35 GB", price: 299, vat: "ไม่รวม VAT" },
  { id: 4, title: "เน็ตเพิ่มสปีด 20GB 199บาท นาน 15วัน", validity: "15 วัน", speed: "20 GB", price: 199, vat: "ไม่รวม VAT" },
];

export const PromotionMonthyNolimit: PromotionItem[] = [
  { id: 1, title: "เน็ตเต็มสปีดไม่อั้น 199บาท นาน 7วัน", validity: "7 วัน", speed: "ไม่จำกัด", price: 199, vat: "ไม่รวม VAT" },
  { id: 2, title: "เน็ตเต็มสปีดไม่อั้น 99บาท นาน 3วัน", validity: "3 วัน", speed: "ไม่จำกัด", price: 99, vat: "ไม่รวม VAT" },
];

export const PromotionMonthySocial: PromotionItem[] = [
  { id: 1, title: "เน็ตYouTube,Facebook,Line,Twitterไม่อั้น 199บาท นาน30วัน", validity: "30 วัน", speed: "เน็ตไม่อั้นสำหรับ YouTube, Facebook, Line, Twitter", price: 199, vat: "ไม่รวม VAT" },
  { id: 2, title: "เน็ตYouTubeไม่อั้น 29บาท นาน1วัน", validity: "1 วัน", speed: "เน็ตไม่อั้น สำหรับ YouTube", price: 29, vat: "ไม่รวม VAT" },
  { id: 3, title: "เน็ตYouTubeไม่อั้น 179บาท นาน 30วัน", validity: "30 วัน", speed: "เน็ตไม่อั้น สำหรับ YouTube", price: 179, vat: "ไม่รวม VAT" },
  { id: 4, title: "เน็ตYouTubeไม่อั้น 159บาท ต่ออายุอัตโนมัติ", validity: "30 วัน", speed: "เน็ตไม่อั้น สำหรับ YouTube", price: 159, vat: "ไม่รวม VAT" },
  { id: 5, title: "เน็ตทรูไอดีไม่อั้น 24 ชม.", validity: "1 วัน", speed: "เน็ตไม่อั้น สำหรับแอป TrueID", price: 9, vat: "ไม่รวม VAT" },
  { id: 6, title: "เน็ตทรูไอดีไม่อั้น 7วัน", validity: "7 วัน", speed: "เน็ตไม่อั้น สำหรับแอป TrueID", price: 19, vat: "ไม่รวม VAT" },
];

export const PromotionMonthyCall: PromotionItem[] = [
  { id: 1, title: "โทร 100 นาที 109 บาท นาน 30 วัน", validity: "30 วัน", call: "โทร 100 นาที", price: 109, vat: "ไม่รวม VAT" },
  { id: 2, title: "โทร 150 นาที 149 บาท นาน 30 วัน", validity: "30 วัน", call: "โทร 150 นาที", price: 149, vat: "ไม่รวม VAT" },
  { id: 3, title: "โทร 200 นาที 199 บาท นาน 30 วัน", validity: "30 วัน", call: "โทร 200 นาที", price: 199, vat: "ไม่รวม VAT" },
  { id: 4, title: "โทร 300 นาที 249 บาท นาน 30 วัน", validity: "30 วัน", call: "โทร 300 นาที", price: 249, vat: "ไม่รวม VAT" },
];

export const PromotionMonthyAsianCombo: PromotionItem[] = [
  { id: 1, title: "แพ็กเกจ Asian Combo", speed: "ดูซีรีส์ไม่อั้น", validity: "30 วัน", unlock: "รับชม Viu, iQIYI, WeTV", price: 399, vat: "รวม VAT", imgae: [{ icon: "/assets/Icon/icon-vdo.webp" }], phone: "โทรฟรี 100 นาที" },
];

export const PromotionMonthyComboplus: PromotionItem[] = [
  { id: 1, title: "แพ็กเกจ Combo+", speed: "ดูซีรีส์และหนังไม่อั้น", validity: "30 วัน", unlock: "รับชม Netflix", price: 499, vat: "รวม VAT", imgae: [{ icon: "/assets/Icon/icon-vdo.webp" }], phone: "โทรฟรี 200 นาที" },
];

export const PromotionMonthyViu: PromotionItem[] = [
  { id: 1, title: "Viu Premium", speed: "ดู Viu ไม่อั้น", validity: "30 วัน", unlock: "Viu Premium", price: 119, vat: "รวม VAT", imgae: [{ icon: "/assets/Icon/icon-vdo.webp" }] },
];

export const PromotionMonthyIqiyi: PromotionItem[] = [
  { id: 1, title: "iQIYI VIP", speed: "ดู iQIYI ไม่อั้น", validity: "30 วัน", unlock: "iQIYI VIP", price: 119, vat: "รวม VAT", imgae: [{ icon: "/assets/Icon/icon-vdo.webp" }] },
];

export const PromotionMonthyWeTV: PromotionItem[] = [
  { id: 1, title: "WeTV VIP", speed: "ดู WeTV ไม่อั้น", validity: "30 วัน", unlock: "WeTV VIP", price: 119, vat: "รวม VAT", imgae: [{ icon: "/assets/Icon/icon-vdo.webp" }] },
];

export const PromotionInsuranceCumulative: PromotionItem[] = [
  { id: 1, title: "ประกันชีวิตคุ้มครองสะสม", speed: "คุ้มครอง 100,000 บาท", validity: "30 วัน", price: 499, vat: "รวม VAT" },
];

export const PromotionFreeAcidentInsurance: PromotionItem[] = [
  { id: 1, title: "ฟรีประกันอุบัติเหตุ", speed: "คุ้มครอง 50,000 บาท", validity: "30 วัน", price: 99, vat: "รวม VAT" },
];

export const PromotionConsultcoupon: PromotionItem[] = [
  { id: 1, title: "คูปองปรึกษาแพทย์", speed: "ปรึกษาแพทย์ออนไลน์ฟรี", validity: "30 วัน", price: 199, vat: "รวม VAT" },
];

export const PromotionWhoscall: PromotionItem[] = [
  { id: 1, title: "Whoscall Premium", speed: "ป้องกันมิจฉาชีพ", validity: "30 วัน", price: 49, vat: "รวม VAT" },
];

export const PromotionGame: PromotionItem[] = [
  { id: 1, title: "เน็ตเล่นเกม", speed: "ROV, FreeFire ไม่อั้น", validity: "30 วัน", coupon: "ฟรีไอเทมโค้ด", iconCoupon: [{ icon: "/assets/Icon/icon-vdo.webp" }], price: 299, vat: "ไม่รวม VAT", note: "รับไอเทมเกมสุดพิเศษ" },
];

export const PromotionCouponLiftstyle: PromotionItem[] = [
  { id: 1, title: "คูปองส่วนลด", speed: "ส่วนลด 50 บาท", validity: "30 วัน", coupon: "ฟรีคูปอง", iconCoupon: [{ icon: "/assets/Icon/icon-vdo.webp" }], price: 99, vat: "ไม่รวม VAT", note: "รับคูปองส่วนลดพิเศษ" },
];
