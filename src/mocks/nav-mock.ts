interface SubItem {
  name: string;
  link: string;
}
interface NavItem {
  title: string;
  subItems: SubItem[];
}

export const mockData: NavItem[] = [
  {
    title: "แพ็กเกจเน็ตบ้าน",
    subItems: [
      { name: "แพ็กเกจเน็ตบ้าน", link: "/boardband" },
    ],
  },
  {
    title: "แพ็กเกจเน็ตมือถือ",
    subItems: [
      { name: "เติมเงิน", link: "/topup" },
      { name: "รายเดือน", link: "/monthly" },
    ],
  },
  {
    title: "โซล่าเซลล์ W&W Energy",
    subItems: [
      { name: "โซล่าเซลล์ W&W Energy", link: "/wEnergy" },
    ],
  },
  {
    title: "บริการ & สอบถาม",
    subItems: [
      { name: "บริการ", link: "/service" },
     
    ],
    //ttt
  },
];
