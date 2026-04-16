import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "เรื่องราวการให้บริการและแนวทางดูแลลูกค้าของ True Fiber Home รวมถึงแนวทางใช้งานอินเทอร์เน็ตอย่างปลอดภัย",
  alternates: { canonical: "/stories" },
};

export default function StoriesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-24 text-slate-800">
      <h1 className="text-3xl font-bold text-slate-900">Stories & Insights</h1>
      <p className="mt-4 text-slate-700 leading-7">
        หน้านี้รวบรวมแนวทางการใช้งานแพ็กเกจให้คุ้มค่า ประสบการณ์การให้บริการ และข้อแนะนำด้านความปลอดภัยออนไลน์สำหรับผู้ใช้งานทั่วไป
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">เนื้อหาที่กำลังอัปเดต</h2>
        <p className="text-slate-700 leading-7">
          เรากำลังจัดทำบทความเชิงคุณภาพ เช่น วิธีเลือกแพ็กเกจให้เหมาะกับบ้าน, แนวทางรับมือการหลอกลวงออนไลน์,
          และเช็กลิสต์ก่อนติดตั้งอินเทอร์เน็ต เพื่อให้ผู้ใช้สามารถตัดสินใจได้อย่างมั่นใจ
        </p>
      </section>
    </main>
  );
}
