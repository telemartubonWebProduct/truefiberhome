import type { CardItem } from "@/src/types/package";

// ===== Topup Card Items =====
export const topupCardItems: CardItem[] = [
  {
    title: "แพ็กเกจเสริมเน้นเน็ต",
    detail: "แพ็กเกจเสริมเน้นเน็ต ทั้งเน็ตเพิ่มสปีดหรือเน็ตไม่จำกัด",
    image: "/assets/PackagePlan/Topup/thumb-01.webp",
    hoverImage: "/assets/PackagePlan/Topup/thumb-01.webp",
    path: "/topup#internet",
  },
  {
    title: "แพ็กเกจความบันเทิง",
    detail: "แพ็กเกจเสริมคัดพิเศษสำหรับสายบันเทิง",
    image: "/assets/PackagePlan/Topup/thumb-02.webp",
    hoverImage: "/assets/PackagePlan/Topup/thumb-02.webp",
    path: "/topup#entertain",
  },
  {
    title: "แพ็กเกจเน้นเกม",
    detail: "แพ็กเกจเสริมสำหรับเหล่าเกมเมอร์",
    image: "/assets/PackagePlan/Topup/thumb-03.webp",
    hoverImage: "/assets/PackagePlan/Topup/thumb-03.webp",
    path: "/topup#game",
  },
  {
    title: "แพ็กเกจเน้นโทร",
    detail: "แพ็กเกจเสริมหลากหลายคัดเฉพาะคนช่างคุย",
    image: "/assets/PackagePlan/Topup/thumb-04.webp",
    hoverImage: "/assets/PackagePlan/Topup/thumb-04.webp",
    path: "/topup#call",
  },
];

// ===== Monthly Card Items =====
export const monthlyCardItems: CardItem[] = [
  {
    title: "แพ็กเกจเสริมเน้นเน็ต",
    detail: "แพ็กเกจเสริมเน้นเน็ตตามความชอบ ทั้งเน็ตเพิ่มสปีดหรือเน็ตไม่จำกัด",
    image: "/assets/PackagePlan/Topup/thumb-01.webp",
    hoverImage: "/assets/PackagePlan/Topup/thumb-01.webp",
    package: [],
    path: "/monthy#internetpure",
  },
  {
    title: "แพ็กเกจเสริมความบันเทิง",
    detail: "แพ็กเกจเสริมหลากหลายสำหรับไลฟ์สไตล์ของคนช่างคุย",
    image: "/assets/PackagePlan/Topup/thumb-02.webp",
    hoverImage: "/assets/PackagePlan/Topup/thumb-02.webp",
    package: [
      { icon: "/assets/package-ico/icon-TVS-Now.png", title: "TrueID TV" },
      { icon: "/assets/package-ico/icon-Wetv.png", title: "TrueID TV" },
      { icon: "/assets/package-ico/icon-viu-01.png", title: "TrueID TV" },
      { icon: "/assets/package-ico/icon-iQIYI-01.png", title: "TrueID TV" },
    ],
    path: "/monthy#entertainment",
  },
  {
    title: "แพ็กเกจเสริมเกม&ไลฟ์สไตล์",
    detail: "แพ็กเกจเสริมพิเศษสำหรับสายเกมเมอร์",
    image: "/assets/PackagePlan/Topup/thumb-03.webp",
    hoverImage: "/assets/PackagePlan/Topup/thumb-03.webp",
    package: [
      { icon: "/assets/package-ico/icon-PUBG.png", title: "TrueID TV" },
      { icon: "/assets/package-ico/icon-rov.png", title: "TrueID TV" },
      { icon: "/assets/package-ico/icon-up.png", title: "TrueID TV" },
      { icon: "/assets/package-ico/icon-game.png", title: "TrueID TV" },
    ],
    path: "/monthy#game",
  },
  {
    title: "แพ็กเกจเสริมเน้นโซเชียล",
    detail: "แพ็กเกจเสริมสำหรับสายโซเชียลโดยเฉพาะ",
    image: "/assets/PackagePlan/Topup/thumb-04.webp",
    hoverImage: "/assets/PackagePlan/Topup/thumb-04.webp",
    package: [],
    path: "/monthy#socialInternet",
  },
];
