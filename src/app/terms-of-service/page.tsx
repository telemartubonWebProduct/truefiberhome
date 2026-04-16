import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ข้อกำหนดการใช้บริการ",
  description:
    "ข้อกำหนดและเงื่อนไขการใช้บริการของ True Fiber Home สำหรับผู้ใช้เว็บไซต์และผู้ติดต่อขอรับบริการ",
  alternates: { canonical: "/terms-of-service" },
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-24 text-slate-800">
      <h1 className="text-3xl font-bold text-slate-900">ข้อกำหนดการใช้บริการ</h1>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">1. การใช้งานเว็บไซต์</h2>
        <p>ผู้ใช้ตกลงใช้งานเว็บไซต์เพื่อวัตถุประสงค์ที่ชอบด้วยกฎหมาย และไม่กระทำการที่กระทบต่อความปลอดภัยหรือความน่าเชื่อถือของระบบ</p>
      </section>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">2. ข้อมูลแพ็กเกจและราคา</h2>
        <p>ข้อมูลแพ็กเกจและราคาอาจเปลี่ยนแปลงตามเงื่อนไขของผู้ให้บริการหลัก โปรดตรวจสอบเงื่อนไขล่าสุดกับเจ้าหน้าที่ก่อนตัดสินใจทุกครั้ง</p>
      </section>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">3. ลิงก์ภายนอก</h2>
        <p>เว็บไซต์อาจมีลิงก์ไปยังแพลตฟอร์มภายนอก ผู้ใช้ควรตรวจสอบความถูกต้องของโดเมนปลายทางก่อนกรอกข้อมูลหรือทำธุรกรรม</p>
      </section>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">4. การจำกัดความรับผิด</h2>
        <p>เราไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้งานผิดวัตถุประสงค์ หรือจากการหลอกลวงโดยบุคคลภายนอกที่ไม่ใช่ช่องทางทางการของบริษัท</p>
      </section>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">5. การยกเลิกและการคืนเงิน</h2>
        <p>
          การยกเลิกบริการและการคืนเงินเป็นไปตามเงื่อนไขของผู้ให้บริการหลักและประเภทบริการที่สมัครจริง โดยลูกค้าสามารถติดต่อเจ้าหน้าที่เพื่อรับเอกสารเงื่อนไขล่าสุดก่อนตัดสินใจ
        </p>
      </section>

      <section className="mt-8 space-y-3 text-slate-700 leading-7">
        <h2 className="text-xl font-semibold text-slate-900">6. ช่องทางติดต่อทางการ</h2>
        <p>
          หากต้องการยืนยันข้อมูลแพ็กเกจ ราคา การชำระเงิน หรือสถานะคำขอ โปรดติดต่อผ่านช่องทางที่ประกาศในหน้าเว็บไซต์เท่านั้น เพื่อป้องกันความเสี่ยงจากการแอบอ้าง
        </p>
      </section>
    </main>
  );
}
