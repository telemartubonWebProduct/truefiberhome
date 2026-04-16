import { prisma } from "@/src/lib/prisma";
import ServiceContentForm from "./components/ServiceContentForm";

export default async function ServiceContentPage() {
  const homeSectionDelegate = (prisma as any).homeSection;

  const serviceSection = homeSectionDelegate
    ? await homeSectionDelegate.findUnique({ where: { sectionKey: "servicePageContent" } })
    : null;

  const s = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white">จัดการหน้า Service</h1>
        <p className="text-gray-400 mt-1">
          จัดการข้อความ เบอร์ติดต่อ Line Facebook พิกัดที่ตั้ง รูปภาพ และเนื้อหาสำหรับหน้าบริการติดตั้ง/ย้ายจุด
        </p>
      </div>

      <section>
        <div className="mb-6 pb-2 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Service Page Content</h2>
          <p className="text-sm text-gray-500">ข้อมูลที่บันทึกจะถูกแสดงที่หน้า /service ทันที</p>
        </div>
        <ServiceContentForm initialData={s(serviceSection)} />
      </section>
    </div>
  );
}
