import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา",
  description:
    "รู้จัก True Fiber Home ผู้ให้บริการด้านเน็ตบ้านและโซลูชันดิจิทัล พร้อมทีมงานมืออาชีพและช่องทางติดต่อที่ตรวจสอบได้",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-24 text-slate-800">
      <h1 className="text-3xl font-bold text-slate-900">เกี่ยวกับ True Fiber Home</h1>
      <p className="mt-4 text-slate-700 leading-7">
        True Fiber Home ให้บริการด้านแพ็กเกจอินเทอร์เน็ตบ้าน ซิมมือถือ และโซลูชันพลังงาน โดยมุ่งเน้นความชัดเจน โปร่งใส และตรวจสอบได้ทุกขั้นตอน
        เพื่อให้ลูกค้าได้รับบริการที่เหมาะสมกับการใช้งานจริง
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">สิ่งที่เราให้ความสำคัญ</h2>
        <ul className="list-disc pl-6 text-slate-700 space-y-2">
          <li>ให้ข้อมูลแพ็กเกจและเงื่อนไขอย่างตรงไปตรงมา</li>
          <li>มีช่องทางติดต่อเจ้าหน้าที่ที่ชัดเจนและตรวจสอบได้</li>
          <li>ไม่ขอข้อมูลส่วนบุคคลเกินความจำเป็น</li>
          <li>ดูแลหลังการขายและให้คำแนะนำอย่างต่อเนื่อง</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">การตรวจสอบความน่าเชื่อถือ</h2>
        <p className="text-slate-700 leading-7">
          โปรดตรวจสอบโดเมนเว็บไซต์และช่องทางติดต่อจากหน้า Contact และนโยบาย Anti‑Phishing ทุกครั้งก่อนทำธุรกรรม
        </p>
      </section>
    </main>
  );
}
