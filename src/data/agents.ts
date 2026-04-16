import type { Agent, WhyChooseItem, ProcessStep } from "@/src/types/content";

// ===== Agent Data =====
export const agentsData: Agent[] = [
  {
    id: 1,
    name: "มานะ ก้องเกียรติ",
    phoneNumber: "089-123-4567",
    role: "เซลล์ประจำพื้นที่",
    closedDeal: 199,
    photo: "",
  },
  {
    id: 2,
    name: "สิมา เกษมสิทธิ์",
    phoneNumber: "089-987-6543",
    role: "ผู้เชี่ยวชาญด้านการจำหน่ายและบริการ",
    closedDeal: 250,
    photo: "",
  },
  {
    id: 3,
    name: "ดนัย บริสุทธิ์",
    phoneNumber: "081-222-3333",
    role: "เซลล์ประจำพื้นที่",
    closedDeal: 180,
    photo: "",
  },
];

// ===== Why Choose Us =====
export const whyChooseItems: WhyChooseItem[] = [
  {
    iconName: "Timer",
    title: "ติดตั้งรวดเร็ว",
    desc: "บริการนัดหมายและติดตั้งอย่างรวดเร็ว พร้อมใช้งานภายใน 24 ชั่วโมง",
  },
  {
    iconName: "SupportAgent",
    title: "บริการโดยผู้เชี่ยวชาญ",
    desc: "ทีมงานเทคนิคระดับมืออาชีพ พร้อมดูแลและให้คำปรึกษาตลอดการใช้งาน",
  },
  {
    iconName: "Router",
    title: "อุปกรณ์ล้ำสมัย",
    desc: "สัมผัสประสบการณ์ที่ดีที่สุดด้วย Gigatex Mesh WiFi รุ่นท็อปสุด",
  },
];

// ===== Process Steps =====
export const processSteps: ProcessStep[] = [
  {
    num: 1,
    iconName: "Map",
    title: "ตรวจสอบพื้นที่ให้บริการ",
    desc: "ตรวจสอบพื้นที่บริการทรูออนไลน์",
  },
  {
    num: 2,
    iconName: "Checklist",
    title: "เลือกโปรโมชั่นที่ต้องการ",
    desc: "สมัครโปรโมชั่นสุดคุ้ม",
  },
  {
    num: 3,
    iconName: "Engineering",
    title: "นัดหมายและช่างเข้าติดตั้ง",
    desc: "นัดหมายวันเข้าติดตั้งอุปกรณ์",
  },
];
