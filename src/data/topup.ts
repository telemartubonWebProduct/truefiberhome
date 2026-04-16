import type { PackageCategory, PackageItem, PromotionItem } from "@/src/types/package";
import type { BannerData } from "@/src/types/content";

// ===== Topup Banners =====
export const topupBanner: BannerData[] = [
  { id: 1, image: "/assets/topup/prepaid_VAS.webp" },
];

export const topupBannerMobile: BannerData[] = [
  { id: 1, image: "/assets/topup/prepaid_VAS_mobile.webp" },
];

// ===== Topup Promotions (BannerTop) =====
export const topupPromotions: PromotionItem[] = [
  {
    id: 1,
    title: "เน็ตไม่อั้น 8Mbps (30GB) FUP 1Mbps 8วัน",
    validity: "8 วัน",
    speed: "8 Mbps ใช้ได้ 30GB",
    price: 88,
    vat: "ไม่รวม VAT",
  },
  {
    id: 2,
    title: "เน็ตไม่อั้น 10Mbps (50GB) FUP 2Mbps 15วัน",
    validity: "15 วัน",
    speed: "10 Mbps ใช้ได้ 50GB",
    price: 150,
    vat: "ไม่รวม VAT",
  },
  {
    id: 3,
    title: "เน็ตไม่อั้น 5Mbps (15GB) FUP 512Kbps 5วัน",
    validity: "5 วัน",
    speed: "5 Mbps ใช้ได้ 15GB",
    price: 50,
    vat: "ไม่รวม VAT",
  },
  {
    id: 4,
    title: "เน็ตไม่อั้น 20Mbps (Unlimited) FUP 5Mbps 30วัน",
    validity: "30 วัน",
    speed: "20 Mbps ใช้งานได้ไม่จำกัด",
    price: 300,
    vat: "ไม่รวม VAT",
  },
];

// ===== Topup Categories (PackageList) =====
export const topupCategories: PackageCategory[] = [
  { id: 1, name: "เน็ต", slug: "net" },
  { id: 2, name: "เน็ต + โทร", slug: "net-call" },
  { id: 3, name: "โทร", slug: "call" },
  { id: 4, name: "เอ็นเตอร์เทนเมนท์", slug: "entertainment" },
  { id: 5, name: "เกมส์", slug: "games" },
  { id: 6, name: "insurance", slug: "insurance" },
];

// ===== Topup Packages (PackageList) =====
export const topupPackages: PackageItem[] = [
  {
    id: 1, category_id: 1,
    name: "เน็ตไม่อั้น 8Mbps (30GB) FUP 1Mbps 8วัน",
    price: 88, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "8 Mbps ใช้ได้ 30GB", imageUrl: "wifi" },
      { text: "8 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 2, category_id: 1,
    name: "เน็ตไม่อั้น 10Mbps (50GB) FUP 2Mbps 15วัน",
    price: 150, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "10 Mbps ใช้ได้ 50GB", imageUrl: "wifi" },
      { text: "15 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 3, category_id: 1,
    name: "เน็ตไม่อั้น 5Mbps (15GB) FUP 512Kbps 5วัน",
    price: 50, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "5 Mbps ใช้ได้ 15GB", imageUrl: "wifi" },
      { text: "5 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 4, category_id: 1,
    name: "เน็ตไม่อั้น 20Mbps (Unlimited) FUP 5Mbps 30วัน",
    price: 300, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "20 Mbps ใช้งานได้ไม่จำกัด", imageUrl: "wifi" },
      { text: "30 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 5, category_id: 2,
    name: "เน็ต 15Mbps + โทรฟรีทุกเครือข่าย 30วัน",
    price: 200, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "15 Mbps ไม่ลดสปีด", imageUrl: "wifi" },
      { text: "โทรฟรี 24 ชม. (ครั้งละ 15 นาที)", imageUrl: "phone" },
      { text: "30 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 6, category_id: 3,
    name: "โทรฟรีทุกเครือข่ายไม่อั้น 30วัน",
    price: 100, price_note: "(ไม่รวม VAT)", is_active: true,
    perks: [
      { text: "โทรฟรี 24 ชม. (ครั้งละ 30 นาที)", imageUrl: "phone" },
      { text: "30 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 7, category_id: 4,
    name: "แพ็กเกจดูซีรีส์และหนังไม่อั้น 30วัน",
    price: 199, price_note: "(รวม VAT)", is_active: true,
    perks: [
      { text: "รับชมซีรีส์ระดับพรีเมียม", imageUrl: "tv" },
      { text: "30 วัน", imageUrl: "calendar" },
    ],
  },
  {
    id: 8, category_id: 4,
    name: "แพ็กเกจดูบอลพรีเมียร์ลีก 30วัน",
    price: 299, price_note: "(รวม VAT)", is_active: true,
    perks: [
      { text: "รับชมกีฬาระดับโลก", imageUrl: "tv" },
      { text: "30 วัน", imageUrl: "calendar" },
    ],
  },
];
