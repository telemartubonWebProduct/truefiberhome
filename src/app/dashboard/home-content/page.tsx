import { prisma } from "@/src/lib/prisma";
import BannerList from "../banners/components/BannerList";
import SiteSettingsForm from "./components/SiteSettingsForm";
import AgentManager from "./components/AgentManager";
import NavigationItemManager from "./components/NavigationItemManager";
import FooterLinkManager from "./components/FooterLinkManager";
import HomeHeroVideoForm from "./components/HomeHeroVideoForm";
import HomeInstallPromotionForm from "./components/HomeInstallPromotionForm";
import HomePromotionPresentSettingsForm from "./components/HomePromotionPresentSettingsForm";
import PackageTable from "./components/PackageTable";
import HomeContactSectionForm from "./components/HomeContactSectionForm";
import ContactMethodManager from "./components/ContactMethodManager";

export default async function HomeContentPage() {
  const homeSectionDelegate = (prisma as any).homeSection;
  const packageDelegate = (prisma as any).package;
  const contactMethodDelegate = (prisma as any).contactMethod;

  const [
    banners,
    settings,
    navigationItems,
    footerLinks,
    agents,
    packages,
    contactMethods,
    homeHeroVideo,
    homeInstallPromotion,
    homePromotionPresent,
    homeContactSection,
  ] = await Promise.all([
    prisma.banner.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.navigationItem.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.footerLink.findMany({ orderBy: [{ section: "asc" }, { displayOrder: "asc" }] }),
    prisma.agent.findMany({ orderBy: { displayOrder: "asc" } }),
    packageDelegate ? packageDelegate.findMany({ orderBy: { displayOrder: "asc" } }) : [],
    contactMethodDelegate ? contactMethodDelegate.findMany({ orderBy: { displayOrder: "asc" } }) : [],
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homeHeroVideo" } }) : null,
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homeInstallPromotion" } }) : null,
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homePromotionPresent" } }) : null,
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homeContactSection" } }) : null,
  ]);

  const settingsFallback = settings ?? {
    id: "singleton",
    logoUrl: null,
    phone: null,
    email: null,
    referralSystem: null,
    description: null,
    footerImageUrl: null,
    updatedAt: new Date(),
  };

  // Serialise dates for client components
  const s = (data: any) => JSON.parse(JSON.stringify(data));

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">จัดการหน้า Home</h1>
        <p className="text-gray-400 mt-1">โหมดสเต็ป 1: แสดงเฉพาะเมนูที่เกี่ยวข้องกับหน้า Home และ Layout ของหน้า Home</p>
      </div>

      <div className="space-y-16">
        {/* 1. Hero Video Block */}
        <section>
          <div className="mb-6 pb-2 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">1. Hero Video (บล็อกหลักด้านซ้าย)</h2>
            <p className="text-sm text-gray-500">จัดการวิดีโอ ข้อความ และปุ่มของบล็อก Hero หลักบนหน้า Home</p>
          </div>
          <HomeHeroVideoForm initialData={s(homeHeroVideo)} />
        </section>

        {/* 2. Install Promotion */}
        <section>
          <div className="mb-6 pb-2 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">2. Install Promotion (บล็อกขวาล่าง)</h2>
            <p className="text-sm text-gray-500">จัดการข้อความ ราคา ปุ่ม และสถานะแสดงผลของกล่องโปรโมชั่นด้านขวา</p>
          </div>
          <HomeInstallPromotionForm initialData={s(homeInstallPromotion)} />
        </section>

        {/* 3. Main Loop Banner */}
        <section>
          <div className="mb-6 pb-2 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">3. แบนเนอร์หลัก (Auto Loop Banner)</h2>
            <p className="text-sm text-gray-500">จัดการภาพสไลด์ในส่วนแบนเนอร์หลักของหน้า Home</p>
          </div>
          <BannerList initialBanners={s(banners)} />
        </section>

        {/* 4. Promotion Present */}
        <section>
          <div className="mb-6 pb-2 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">4. Promotion Present (การ์ดแพ็กเกจ)</h2>
            <p className="text-sm text-gray-500">จัดการการแสดงผลส่วนการ์ดแพ็กเกจ และเพิ่ม/ลบ/แก้ไขการ์ดโปรโมชั่น</p>
          </div>
          <HomePromotionPresentSettingsForm initialData={s(homePromotionPresent)} />
          <PackageTable initialPackages={s(packages)} />
        </section>

        {/* 5. Sales Agent Section */}
        <section>
          <div className="mb-6 pb-2 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">5. Contact Section (ช่องทางติดต่อ)</h2>
            <p className="text-sm text-gray-500">จัดการหัวข้อส่วนติดต่อ และเพิ่ม/ลบ/แก้ไขการ์ด LINE/โทร/Facebook รวมถึงอัปโหลดรูปไอคอนแต่ละการ์ด</p>
          </div>
          <HomeContactSectionForm initialData={s(homeContactSection)} />
          <ContactMethodManager initialItems={s(contactMethods)} />
        </section>

        {/* 6. Sales Agent Section */}
        <section>
          <div className="mb-6 pb-2 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">6. ทีมผู้เชี่ยวชาญ (Sales Section)</h2>
            <p className="text-sm text-gray-500">จัดการข้อมูลเจ้าหน้าที่ขายในส่วน Saler Service ของหน้า Home</p>
          </div>
          <AgentManager initialAgents={s(agents)} />
        </section>

        {/* 7. Navbar */}
        <section>
          <div className="mb-6 pb-2 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">7. เมนูหลัก Navbar</h2>
            <p className="text-sm text-gray-500">จัดการโครงลิงก์เมนูของแถบนำทางด้านบน</p>
          </div>
          <NavigationItemManager initialItems={s(navigationItems)} />
        </section>

        {/* 8. Footer Links */}
        <section>
          <div className="mb-6 pb-2 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">8. ลิงก์ Footer</h2>
            <p className="text-sm text-gray-500">จัดการลิงก์ส่วน Company, Services และ Support ด้านล่างเว็บไซต์</p>
          </div>
          <FooterLinkManager initialItems={s(footerLinks)} />
        </section>

        {/* 9. Site Settings */}
        <section>
          <div className="mb-6 pb-2 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">9. ข้อมูลระบบของเว็บไซต์</h2>
            <p className="text-sm text-gray-500">จัดการโลโก้ ข้อมูลติดต่อ และค่าพื้นฐานที่ใช้ร่วมกันในหน้า Home</p>
          </div>
          <SiteSettingsForm initialSettings={s(settingsFallback)} />
        </section>

        {/* <section>
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-200">
              สเต็ป Home หลักครบแล้ว: ตอนนี้สามารถจัดการทุกจุดหลักบนหน้า Home แบบ CRUD ได้เรียบร้อย
            </p>
          </div>
        </section> */}
      </div>
    </div>
  );
}
