"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import WifiIcon from "@mui/icons-material/Wifi";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PhoneIcon from "@mui/icons-material/Phone";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import TvIcon from "@mui/icons-material/Tv";
import ShieldIcon from "@mui/icons-material/Shield";
import SpeedIcon from "@mui/icons-material/Speed";
import HeaderMonthy from "./Header";
import type { PackageCategory, PackageItem } from "@/src/types/package";
import { monthlyCategories as CATEGORIES, monthlyPackages as FALLBACK_PACKAGES } from "@/src/data/monthly";
import { useSiteSettings } from "@/src/context/SiteSettingsContext";

function renderIcon(icon?: string) {
  const props = { className: "mr-2 h-[18px] w-[18px] text-gray-500" };
  switch (icon) {
    case "wifi":
      return <WifiIcon {...props} />;
    case "speed":
      return <SpeedIcon {...props} />;
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

interface PromotionMonthyProps {
  categories?: PackageCategory[];
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

export default function PromotionMonthy({
  categories = CATEGORIES,
  packages = FALLBACK_PACKAGES,
}: PromotionMonthyProps) {
  const [activeTab, setActiveTab] = useState<string>("ทั้งหมด");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { lineSupportUrl } = useSiteSettings();

  const tabs = useMemo(() => ["ทั้งหมด", ...categories.map((c) => c.name)], [categories]);

  const displayedCategories = useMemo(() => {
    if (activeTab === "ทั้งหมด") {
      return categories;
    }
    return categories.filter((c) => c.name === activeTab);
  }, [categories, activeTab]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === "ทั้งหมด") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const ref = sectionRefs.current[tab];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Box className="w-full max-w-6xl mx-auto px-4 py-8">
      <HeaderMonthy tabs={tabs} onTabClick={handleTabClick} />

      <div className="mt-12 space-y-14">
        {displayedCategories.map((category) => {
          const categoryPackages = packages.filter((p) => p.category_id === category.id);
          if (categoryPackages.length === 0) return null;

          return (
            <div
              key={category.id}
              ref={(el) => {
                sectionRefs.current[category.name] = el;
              }}
              className="scroll-mt-20"
            >
              <h2 className="ml-2 mb-7 text-[23px] font-bold tracking-tight text-slate-900">{category.name}</h2>

              <motion.div
                variants={gridVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
              >
                {categoryPackages.map((pkg) => {
                  const buyUrl = pkg.buy_link && pkg.buy_link !== "#" ? pkg.buy_link : lineSupportUrl;
                  return (
                    <motion.article
                      key={`${pkg.id}-${pkg.name}`}
                      variants={cardVariants}
                      whileHover={{ y: -4 }}
                      className="group relative flex min-h-[250px] flex-col justify-between rounded-[20px] border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-md"
                    >
                      {pkg.promo_badge && (
                        <span className="absolute -right-1 -top-3 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white shadow-md">
                          {pkg.promo_badge}
                        </span>
                      )}

                      <div>
                        <h3 className="pr-4 text-[17px] font-bold leading-[1.4] text-slate-900">{pkg.name}</h3>

                        {pkg.perks && pkg.perks.length > 0 && (
                          <div className="mt-6 space-y-3.5">
                            {pkg.perks.map((perk, idx) => (
                              <div key={`${pkg.id}-perk-${idx}`} className="flex items-center text-[13.5px] font-medium text-slate-600">
                                {renderIcon(perk.imageUrl)}
                                <span>{perk.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex items-end justify-between border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-[30px] font-black leading-none tracking-tighter text-slate-900">
                            {pkg.price.toLocaleString()}
                            <span className="ml-1 text-[14px] font-bold">บาท</span>
                          </p>
                          {pkg.price_note && <p className="mt-1 text-[11px] font-medium text-slate-500">{pkg.price_note}</p>}
                        </div>

                        <button
                          onClick={() => window.open(buyUrl, "_blank", "noopener,noreferrer")}
                          className="mb-0.5 rounded-full bg-slate-900 px-7 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-700"
                        >
                          ซื้อเลย
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            </div>
          );
        })}
      </div>
    </Box>
  );
}
