import type { Metadata } from "next";
import TermsAndPrivacyClient from "@/src/app/termsAndPrivacy/TermsAndPrivacyClient";

export const metadata: Metadata = {
  title: "ข้อตกลงการใช้บริการและนโยบายความเป็นส่วนตัว",
  description:
    "ข้อตกลงการใช้บริการ (Terms of Service) และนโยบายความเป็นส่วนตัว (Privacy Policy) ของ True Fiber Home ตามกรอบ PDPA พร้อมแนวทางลดความเสี่ยงทางกฎหมาย",
  alternates: { canonical: "/termsAndPrivacy" },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsAndPrivacyPage() {
  return <TermsAndPrivacyClient />;
}
