"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import WifiIcon from "@mui/icons-material/Wifi";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PhoneIcon from "@mui/icons-material/Phone";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import TvIcon from "@mui/icons-material/Tv";
import ShieldIcon from "@mui/icons-material/Shield";
import type { PackageItem } from "@/src/types/package";
import { topupCategories as CATEGORIES, topupPackages as FALLBACK_PACKAGES } from "@/src/data/topup";
import { useSiteSettings } from "@/src/context/SiteSettingsContext";

function renderIcon(icon?: string) {
  const props = { className: "mr-2 h-[18px] w-[18px] text-gray-500" };
  switch (icon) {
    case "wifi":
      return <WifiIcon {...props} />;
    case "calendar":
      return <CalendarTodayIcon {...props} />;
    case "phone":
      return <PhoneIcon {...props} />;
    case "games":
    case "game":
      return <SportsEsportsIcon {...props} />;
    case "tv":
      return <TvIcon {...props} />;
    case "insurance":
      return <ShieldIcon {...props} />;
    default:
      return <WifiIcon {...props} />;
  }
}

interface PackageListProps {
  packages?: PackageItem[];
}

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export default function PackageList({ packages = FALLBACK_PACKAGES }: PackageListProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");
  const { lineSupportUrl } = useSiteSettings();

  const visiblePackages = useMemo(() => {
    if (activeCategoryId === "all") {
      return packages;
    }
    return packages.filter((pkg) => pkg.category_id === activeCategoryId);
  }, [packages, activeCategoryId]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10 flex flex-wrap items-center justify-center gap-2 md:gap-3">
        <button
          onClick={() => setActiveCategoryId("all")}
          className={`rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
            activeCategoryId === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          ทั้งหมด
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategoryId(category.id)}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
              activeCategoryId === category.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {visiblePackages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          ยังไม่มีแพ็กเกจในหมวดนี้
        </div>
      ) : (
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {visiblePackages.map((pkg) => {
            const buyUrl = pkg.buy_link && pkg.buy_link !== "#" ? pkg.buy_link : lineSupportUrl;
            return (
              <motion.article
                key={`${pkg.id}-${pkg.name}`}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className="flex min-h-[230px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <h3 className="text-[16px] font-bold leading-[1.4] text-slate-900">{pkg.name}</h3>

                  {pkg.perks && pkg.perks.length > 0 && (
                    <div className="mt-5 space-y-2.5">
                      {pkg.perks.map((perk, idx) => (
                        <div key={`${pkg.id}-perk-${idx}`} className="flex items-center text-[13px] font-semibold text-slate-600">
                          {renderIcon(perk.imageUrl)}
                          <span>{perk.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-[30px] font-black leading-none tracking-tighter text-slate-900">
                      {pkg.price.toLocaleString()}
                      <span className="ml-1 text-[13px] font-bold">บาท</span>
                    </p>
                    {pkg.price_note && <p className="mt-1 text-[11px] font-semibold text-slate-500">{pkg.price_note}</p>}
                  </div>

                  <button
                    onClick={() => window.open(buyUrl, "_blank", "noopener,noreferrer")}
                    className="rounded-full bg-slate-900 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-700"
                  >
                    ซื้อเลย
                  </button>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}
    </section>
  );
}
