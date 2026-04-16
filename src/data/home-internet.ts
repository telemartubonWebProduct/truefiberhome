import type { SlideData } from "@/src/types/content";

// ===== Home Internet Items =====
export interface HomeInternetItem {
  img: string;
  title: string;
  description: string;
  promotion: { icon: string; alt: string }[];
  path: string;
}

export const homeInternetItems: HomeInternetItem[] = [
  {
    img: "/assets/HomeInternet/home-tol-newcustomer.webp",
    title: "ลูกค้าใหม่",
    description:
      "แพ็กเกจเน็ตบ้านไฟเบอร์อัจฉริยะ อันดับ 1 ที่ตอบโจทย์ไลฟ์สไตล์คุณ แรงสุดคุ้มสุด ปลอดภัยสุด บันเทิงสุด",
    promotion: [
      { icon: "/assets/HomeInternet/newCustomer/ico-cctv.webp", alt: "กล้องวงจรปิด CCTV ฟรี" },
      { icon: "/assets/HomeInternet/newCustomer/ico-premier.webp", alt: "TrueID Premier" },
      { icon: "/assets/HomeInternet/newCustomer/ico-sim.webp", alt: "ซิมมือถือฟรี" },
      { icon: "/assets/HomeInternet/newCustomer/ico-trueid-tv.webp", alt: "TrueID TV" },
    ],
    path: "/broadband",
  },
  {
    img: "/assets/HomeInternet/home-tol-customer.webp",
    title: "ลูกค้าปัจจุบัน",
    description:
      "แพ็กเกจเสริมเพิ่มสปีด อุปกรณ์และบริการเสริม เพื่อน็ตบ้านของคุณ ตลอดจนสิทธิพิเศษต่าง ๆ ที่เลือกได้ตามไลฟ์สไตล์คุณ",
    promotion: [
      { icon: "/assets/HomeInternet/oldcustomer/ico-tvs-now.webp", alt: "TVS Now" },
      { icon: "/assets/HomeInternet/oldcustomer/ico-trueid-tv.webp", alt: "TrueID TV" },
      { icon: "/assets/HomeInternet/oldcustomer/ico-iqiyi.webp", alt: "iQIYI" },
      { icon: "/assets/HomeInternet/oldcustomer/ico-viu.webp", alt: "Viu" },
    ],
    path: "/broadband-old",
  },
  {
    img: "/assets/HomeInternet/home-tol-Applywithagent.webp",
    title: "สมัครกับเจ้าหน้าที่",
    description:
      "สมัครเน็ตบ้านผ่านเจ้าหน้าที่ผู้เชี่ยวชาญ เลือกบริการให้คุณได้มากกว่า",
    promotion: [],
    path: "/wifiService",
  },
];

// ===== Home Internet Slides =====
export const homeInternetSlides: SlideData[] = [
  { id: 1, image: "/assets/HomeInternet/Desktops/BannerHomeInternet1.webp" },
  { id: 2, image: "/assets/HomeInternet/Desktops/BannerHomeInternet2.webp" },
  { id: 3, image: "/assets/HomeInternet/Desktops/BannerHomeInternet3.webp" },
];

export const homeInternetSlidesMobile: SlideData[] = [
  { id: 1, image: "/assets/HomeInternet/Moblie/BannerHomeInternet1.webp" },
  { id: 2, image: "/assets/HomeInternet/Moblie/BannerHomeInternet2.webp" },
  { id: 3, image: "/assets/HomeInternet/Moblie/BannerHomeInternet3.webp" },
];
