import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "มาตรการป้องกันการหลอกลวง (Anti‑Phishing)",
  description:
    "แนวทางตรวจสอบช่องทางทางการและวิธีป้องกันการหลอกลวงออนไลน์ ก่อนทำธุรกรรมหรือให้ข้อมูลส่วนบุคคล",
  alternates: { canonical: "/anti-phishing" },
};

export default function AntiPhishingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-24 text-slate-800">
      <h1 className="text-3xl font-bold text-slate-900">มาตรการป้องกันการหลอกลวง (Anti‑Phishing)</h1>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">ตรวจสอบก่อนทุกครั้ง</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>ตรวจสอบโดเมนเว็บไซต์ให้ถูกต้องก่อนกรอกข้อมูล</li>
          <li>ตรวจสอบชื่อบัญชีหรือช่องทางติดต่อว่าเป็นทางการ</li>
          <li>อย่าคลิกลิงก์จากข้อความที่น่าสงสัยหรือเร่งให้โอนเงินทันที</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">สิ่งที่เราจะไม่ทำ</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>ไม่ขอรหัสผ่าน OTP หรือรหัสยืนยันทางข้อความ</li>
          <li>ไม่ส่งลิงก์ให้โอนเงินไปบัญชีส่วนบุคคลโดยไม่มีเอกสารอ้างอิง</li>
          <li>ไม่ขอข้อมูลบัตรเครดิตผ่านแชตที่ไม่ปลอดภัย</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">หากพบสิ่งผิดปกติ</h2>
        <p>
          หากพบข้อความหรือเว็บไซต์ที่แอบอ้างชื่อบริษัท กรุณาหยุดการทำรายการทันทีและติดต่อช่องทางทางการที่หน้า Home เพื่อยืนยันข้อมูลก่อนดำเนินการต่อ
        </p>
      </section>
    </main>
  );
}
