"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import StoreSearch from "@/src/components/ui/StoreSearch";
import StorePagination from "@/src/components/ui/StorePagination";
import { lineSupport } from "@/src/context/line-path";
import { useSiteSettings } from "@/src/context/SiteSettingsContext";
import {
  installationSteps,
  knowledgeArticles,
  solarBanner,
  solarBenefits,
  solarProductInfo,
  solarStats,
} from "@/src/data/solar";
import type { SolarPlan, WEnergyPageContent } from "../types";

interface WEnergyClientProps {
  plans: SolarPlan[];
  currentPage: number;
  totalPages: number;
  content?: WEnergyPageContent;
}

interface SafeFillImageProps {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  fallbackClassName?: string;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("th-TH").format(value);
}

function articlePreview(value: string): string {
  if (value.length <= 210) {
    return value;
  }
  return `${value.slice(0, 210)}...`;
}

function SafeFillImage({
  src,
  alt,
  sizes,
  className,
  priority = false,
  fallbackClassName = "h-full w-full bg-slate-200",
}: SafeFillImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return <div className={fallbackClassName} aria-hidden="true" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

export default function WEnergyClient({ plans, currentPage, totalPages, content }: WEnergyClientProps) {
  const { lineSupportUrl } = useSiteSettings();
  const heroImage = content?.heroImageUrl || solarBanner[0]?.image || null;
  const primaryContactUrl = content?.heroPrimaryCtaUrl || lineSupportUrl || lineSupport;

  const heroTagline = content?.heroTagline || "W&W Energy";
  const heroTitle = content?.heroTitle || "ติดตั้งโซล่าเซลล์ครบวงจร";
  const heroSubtitle =
    content?.heroSubtitle ||
    "โซลูชันสำหรับบ้านและธุรกิจ ออกแบบโดยทีมวิศวกร พร้อมบริการสำรวจหน้างาน ติดตั้ง และดูแลหลังการขายในมาตรฐานเดียวกันทุกโปรเจกต์";
  const heroPrimaryCtaLabel = content?.heroPrimaryCtaLabel || "ปรึกษาฟรี";
  const heroSecondaryCtaLabel = content?.heroSecondaryCtaLabel || "ดูแพ็กเกจ";

  const productTitle = content?.productTitle || solarProductInfo.title;
  const productSubtitle = content?.productSubtitle || solarProductInfo.subtitle;
  const productDescription = content?.productDescription || solarProductInfo.description;
  const productPhone = content?.productPhone || solarProductInfo.contactPhone;
  const productImage = content?.productImageUrl || solarProductInfo.imageSrc;

  const packageSectionTitle = content?.packageSectionTitle || "แพ็กเกจแนะนำ";
  const packageSectionSubtitle =
    content?.packageSectionSubtitle || "ปรับราคาได้จากหลังบ้าน dashboard และอัปเดตขึ้นหน้านี้อัตโนมัติ";

  const knowledgeTitle = content?.knowledgeTitle || "ความรู้พื้นฐานก่อนติดตั้ง";
  const knowledgeSubtitle =
    content?.knowledgeSubtitle || "สรุปประเด็นสำคัญที่ควรรู้ก่อนตัดสินใจติดตั้งระบบโซล่าเซลล์";
  const knowledgeItems =
    content?.knowledgeItems && content.knowledgeItems.length > 0
      ? content.knowledgeItems
      : knowledgeArticles.slice(0, 3).map((item) => ({
          title: item.title,
          content: item.content,
          imageSrc: item.imageSrc,
          imageAlt: item.imageAlt,
        }));

  const statData = solarStats[0] || {
    province: "77",
    team: "57",
    project: "2115",
    solarcell: "56,304",
  };

  const stats = [
    { icon: <BoltOutlinedIcon className="!text-[20px]" />, value: statData.province, label: "จังหวัด" },
    { icon: <EngineeringOutlinedIcon className="!text-[20px]" />, value: statData.team, label: "ทีมติดตั้ง" },
    { icon: <SavingsOutlinedIcon className="!text-[20px]" />, value: statData.project, label: "โครงการ" },
    { icon: <BoltOutlinedIcon className="!text-[20px]" />, value: statData.solarcell, label: "กำลังผลิตรวม (kW)" },
  ];

  return (
    <main className="bg-[#f4f6f5] pb-20 font-prompt text-slate-800">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <SafeFillImage
            src={heroImage}
            alt="W&W Energy"
            className="object-cover"
            priority
            sizes="100vw"
            fallbackClassName="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/55 to-slate-900/30" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-28 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="max-w-3xl rounded-3xl border border-white/25 bg-white/10 p-7 text-white backdrop-blur-md md:p-10"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-100">{heroTagline}</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">{heroTitle}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100 md:text-base">{heroSubtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={primaryContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              >
                {heroPrimaryCtaLabel}
                <ArrowOutwardRoundedIcon className="!text-[18px]" />
              </a>
              <a
                href="#solar-packages"
                className="inline-flex items-center rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {heroSecondaryCtaLabel}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto mt-7 max-w-6xl px-4">
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:grid-cols-4 md:gap-4 md:p-6"
        >
          {stats.map((item) => (
            <motion.div key={item.label} variants={cardVariants} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-700">{item.icon}</div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{item.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500 md:text-sm">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto mt-14 grid max-w-6xl gap-7 px-4 md:grid-cols-2 md:items-center"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Product Overview</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">{productTitle}</h2>
          <p className="mt-2 text-lg font-medium text-slate-600">{productSubtitle}</p>
          <p className="mt-4 text-sm leading-7 text-slate-600">{productDescription}</p>
          <div className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
            โทรปรึกษา: {productPhone}
          </div>
        </div>

        <div className="relative min-h-[250px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:min-h-[360px]">
          <SafeFillImage
            src={productImage}
            alt={productTitle}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            fallbackClassName="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200"
          />
        </div>
      </motion.section>

      <section id="solar-packages" className="mx-auto mt-16 max-w-6xl px-4">
        <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-70px" }}>
          <div className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-5 md:flex-row md:items-center md:px-6">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">{packageSectionTitle}</h3>
              <p className="mt-1 text-sm text-slate-500">{packageSectionSubtitle}</p>
            </div>
            <a
              href="/dashboard/solar"
              className="inline-flex items-center gap-1 self-start rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition-colors hover:bg-slate-100"
            >
              เปิดหลังบ้าน
              <ArrowOutwardRoundedIcon className="!text-[16px]" />
            </a>
          </div>

          <StoreSearch placeholder="ค้นหาแพ็กเกจโซล่าเซลล์..." />

          {plans.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              ไม่พบแพ็กเกจที่ตรงกับคำค้นหา
            </div>
          ) : (
            <motion.div
              variants={gridVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {plans.map((plan) => (
                <motion.article
                  key={plan.id}
                  variants={cardVariants}
                  whileHover={{ y: -4 }}
                  className="flex min-h-[345px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{plan.packageLabel}</span>
                    {plan.oldPrice && plan.oldPrice > plan.price && (
                      <span className="text-xs font-medium text-slate-400 line-through">฿{formatPrice(plan.oldPrice)}</span>
                    )}
                  </div>

                  <h4 className="mt-4 text-xl font-semibold leading-tight text-slate-900">{plan.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{plan.subtitle}</p>

                  <div className="mt-5 space-y-2.5">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <div key={`${plan.id}-f-${index}`} className="flex items-start text-sm text-slate-600">
                        <CheckRoundedIcon className="mr-2 !text-[18px] text-emerald-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto border-t border-slate-100 pt-5">
                    {plan.note && <p className="mb-2 text-xs text-slate-500">{plan.note}</p>}
                    <div className="flex items-end justify-between gap-3">
                      <p className="text-3xl font-semibold leading-none tracking-tight text-slate-900">
                        ฿{formatPrice(plan.price)}
                      </p>
                      <button
                        onClick={() => window.open(plan.buyUrl && plan.buyUrl !== "#" ? plan.buyUrl : primaryContactUrl, "_blank", "noopener,noreferrer")}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                      >
                        สอบถามแพ็กนี้
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}

          {totalPages > 1 && (
            <div className="mt-8">
              <StorePagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          )}
        </motion.div>
      </section>

      <section className="mx-auto mt-16 grid max-w-6xl gap-6 px-4 lg:grid-cols-[1.2fr_1fr]">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-70px" }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-2xl font-semibold text-slate-900">สิทธิพิเศษเมื่อเลือกบริการติดตั้ง</h3>
          <div className="mt-5 space-y-3">
            {solarBenefits.map((benefit, index) => (
              <div key={`${benefit.text}-${index}`} className="flex items-start rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <CheckRoundedIcon className="mr-2 !text-[18px] text-emerald-600" />
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-70px" }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-xl font-semibold text-slate-900">ขั้นตอนเริ่มต้นบริการ</h3>
          <div className="mt-4 space-y-3">
            {installationSteps.slice(0, 4).map((step, index) => (
              <div key={`${step.title}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                <p className="mt-1 text-xs leading-6 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-70px" }}>
          <h3 className="text-2xl font-semibold text-slate-900">{knowledgeTitle}</h3>
          <p className="mt-2 text-sm text-slate-500">{knowledgeSubtitle}</p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {knowledgeItems.slice(0, 3).map((article, index) => (
              <article key={`${article.title}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-44 w-full">
                  <SafeFillImage
                    src={article.imageSrc}
                    alt={article.imageAlt}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    fallbackClassName="h-full w-full bg-gradient-to-br from-emerald-50 via-slate-100 to-slate-200"
                  />
                </div>
                <div className="p-5">
                  <h4 className="text-base font-semibold text-slate-900">{article.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{articlePreview(article.content)}</p>
                </div>
              </article>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
