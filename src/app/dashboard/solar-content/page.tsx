import { prisma } from "@/src/lib/prisma";
import SolarContentForm from "./components/SolarContentForm";

export default async function SolarContentPage() {
  const homeSectionDelegate = (prisma as any).homeSection;

  const solarSection = homeSectionDelegate
    ? await homeSectionDelegate.findUnique({ where: { sectionKey: "wEnergyPageContent" } })
    : null;

  const s = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white">จัดการคอนเทนต์หน้า Solar</h1>
        <p className="text-gray-400 mt-1">
          แก้ไขข้อความ ปุ่ม และรูปภาพหลักของหน้า /wEnergy ได้จากจุดเดียว
        </p>
      </div>

      <section>
        <div className="mb-6 pb-2 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Solar Content</h2>
          <p className="text-sm text-gray-500">บันทึกแล้วหน้า /wEnergy จะอัปเดตทันที</p>
        </div>

        <SolarContentForm initialData={s(solarSection)} />
      </section>
    </div>
  );
}
