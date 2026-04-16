import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว",
  description:
    "นโยบายความเป็นส่วนตัวของ True Fiber Home อธิบายการเก็บ ใช้ และปกป้องข้อมูลส่วนบุคคลอย่างโปร่งใส",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-24 text-slate-800">
      <h1 className="text-3xl font-bold text-slate-900">นโยบายความเป็นส่วนตัว</h1>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">1. ข้อมูลที่เราเก็บ</h2>
        <p>เราเก็บเฉพาะข้อมูลที่จำเป็นต่อการให้บริการ เช่น ชื่อ ช่องทางติดต่อ และรายละเอียดที่ใช้ในการประสานงานติดตั้งหรือให้คำปรึกษา</p>
      </section>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">2. วัตถุประสงค์การใช้ข้อมูล</h2>
        <p>ใช้เพื่อให้บริการ ตอบคำถาม แจ้งสถานะงาน และปรับปรุงคุณภาพบริการ โดยไม่ขายข้อมูลส่วนบุคคลให้บุคคลที่สาม</p>
      </section>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">3. การเก็บรักษาและความปลอดภัย</h2>
        <p>เรามีมาตรการป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต และจำกัดสิทธิ์การเข้าถึงข้อมูลตามความจำเป็นในการทำงาน</p>
      </section>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">4. สิทธิของเจ้าของข้อมูล</h2>
        <p>ท่านสามารถขอเข้าถึง แก้ไข หรือขอลบข้อมูลส่วนบุคคลได้ผ่านช่องทางติดต่อที่ประกาศบนเว็บไซต์</p>
      </section>
    </main>
  );
}
