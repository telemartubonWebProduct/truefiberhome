"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useHideOnScroll } from "../../hooks/useScrollDirection";

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  parentKey: string | null;
  iconUrl: string | null;
  displayOrder: number;
  isActive?: boolean;
}

interface MenuGroup {
  key: string;
  title: string;
  items: NavigationItem[];
}

interface NavbarProps {
  siteSettings?: {
    logoUrl?: string | null;
  } | null;
  navigationItems?: NavigationItem[];
}

const DEFAULT_PREVIEW_IMAGE =
  "https://images.unsplash.com/photo-1544411135-e10eb7127e26?auto=format&fit=crop&q=80&w=1200";

const GROUP_ORDER: Array<{ key: string; title: string }> = [
  { key: "mega.broadband", title: "แพ็กเกจเน็ตบ้าน" },
  { key: "mega.mobile", title: "แพ็กเกจมือถือ" },
  { key: "mega.energy", title: "โซล่าเซลล์ W&W Energy" },
  { key: "mega.service", title: "บริการและสอบถามทั้งหมด" },
];

const PARENT_KEY_ALIASES: Record<string, string> = {
  broadband: "mega.broadband",
  "products-broadband": "mega.broadband",
  "products.broadband": "mega.broadband",
  mobile: "mega.mobile",
  "products-mobile": "mega.mobile",
  "products.mobile": "mega.mobile",
  energy: "mega.energy",
  solar: "mega.energy",
  "products-energy": "mega.energy",
  "products.energy": "mega.energy",
  service: "mega.service",
  "products-service": "mega.service",
  "products.service": "mega.service",
};

const FALLBACK_NAV_ITEMS: NavigationItem[] = [
  {
    id: "fallback-broadband-1",
    label: "แพ็กเกจเน็ตบ้านทรู",
    path: "/boardband",
    parentKey: "mega.broadband",
    iconUrl:
      "https://trueblog.info/blog/wp-content/uploads/2024/12/256_3-WiFi7-scaled.jpg",
    displayOrder: 0,
    isActive: true,
  },
  {
    id: "fallback-broadband-2",
    label: "บริการติดตั้งและย้ายจุด",
    path: "/service",
    parentKey: "mega.broadband",
    iconUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1200",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "fallback-mobile-1",
    label: "เติมเงิน",
    path: "/topup",
    parentKey: "mega.mobile",
    iconUrl:
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=1200",
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "fallback-mobile-2",
    label: "รายเดือน",
    path: "/monthly",
    parentKey: "mega.mobile",
    iconUrl:
      "https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&q=80&w=1200",
    displayOrder: 3,
    isActive: true,
  },
  {
    id: "fallback-energy-1",
    label: "โซล่าเซลล์ W&W Energy",
    path: "/wEnergy",
    parentKey: "mega.energy",
    iconUrl:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1200",
    displayOrder: 4,
    isActive: true,
  },
  {
    id: "fallback-service-1",
    label: "บริการและสอบถามทั้งหมด",
    path: "/service",
    parentKey: "mega.service",
    iconUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1200",
    displayOrder: 5,
    isActive: true,
  },
];

function normalizeParentKey(parentKey: string | null | undefined): string | null {
  if (!parentKey) return null;
  const normalized = parentKey.trim().toLowerCase();
  if (!normalized) return null;
  return PARENT_KEY_ALIASES[normalized] || normalized;
}

function buildMenuGroups(items: NavigationItem[]): MenuGroup[] {
  const baseGroups = GROUP_ORDER.map((group) => ({ ...group, items: [] as NavigationItem[] }));

  for (const item of items) {
    const groupKey = normalizeParentKey(item.parentKey);
    if (!groupKey) continue;

    const targetGroup = baseGroups.find((group) => group.key === groupKey);
    if (!targetGroup) continue;

    targetGroup.items.push(item);
  }

  for (const group of baseGroups) {
    group.items.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return a.label.localeCompare(b.label, "th");
    });
  }

  return baseGroups.filter((group) => group.items.length > 0);
}

export default function Navbar({ siteSettings, navigationItems }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState(DEFAULT_PREVIEW_IMAGE);

  const menuSourceItems = useMemo(() => {
    if (!Array.isArray(navigationItems) || navigationItems.length === 0) {
      return FALLBACK_NAV_ITEMS;
    }

    const activeItems = navigationItems.filter((item) => item.isActive !== false);
    return activeItems.length > 0 ? activeItems : FALLBACK_NAV_ITEMS;
  }, [navigationItems]);

  const menuGroups = useMemo(() => {
    const groups = buildMenuGroups(menuSourceItems);
    if (groups.length > 0) {
      return groups;
    }
    return buildMenuGroups(FALLBACK_NAV_ITEMS);
  }, [menuSourceItems]);

  const defaultPreviewImage = useMemo(() => {
    const firstWithImage = menuGroups
      .flatMap((group) => group.items)
      .find((item) => typeof item.iconUrl === "string" && item.iconUrl.trim().length > 0);
    return firstWithImage?.iconUrl?.trim() || DEFAULT_PREVIEW_IMAGE;
  }, [menuGroups]);

  const pathname = usePathname();
  const isHiddenRoute =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/backend") || pathname?.startsWith("/login");
  const isHiddenByScroll = useHideOnScroll(50);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const handleMouseEnter = (menu: string) => setActiveMenu(menu);
  const handleMouseLeave = () => setActiveMenu(null);

  useEffect(() => {
    if (activeMenu === "สินค้า") {
      setPreviewImage(defaultPreviewImage);
    }
  }, [activeMenu, defaultPreviewImage]);

  if (isHiddenRoute) return null;

  return (
    <header
      className={`fixed top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4 transition-transform duration-500 ease-in-out ${isHiddenByScroll ? "-translate-y-[150%]" : "translate-y-0"}`}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-full max-w-[900px] bg-white rounded-[10px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] pointer-events-auto relative border border-gray-100">
        <nav className="flex items-center justify-between px-6 py-2.5 lg:px-8 relative z-50">
          <div className="flex items-center">
            <Link href="/home" className="text-[26px] font-black tracking-tighter text-black flex items-center">
              {siteSettings?.logoUrl ? (
                <Image src={siteSettings.logoUrl} alt="Logo" width={110} height={35} className="object-contain" />
              ) : (
                <span>
                  truefiberhome<sup className="text-xs font-bold ml-0.5">&reg;</sup>
                </span>
              )}
            </Link>
          </div>

          <div className="hidden md:flex flex-1 items-center justify-center space-x-10">
            <div className="flex items-center cursor-pointer h-full py-2" onMouseEnter={() => handleMouseEnter("สินค้า")}>
              <span className="text-[12px] font-semibold tracking-widest text-[#4a4a4a] hover:text-black flex items-center transition-colors">
                สินค้า
                <svg className="ml-1 h-[14px] w-[14px] transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            <Link
              href="/about"
              className="text-[12px] font-semibold tracking-widest text-[#4a4a4a] hover:text-black transition-colors py-2"
              onMouseEnter={() => handleMouseEnter("none")}
            >
              เกี่ยวกับ
            </Link>
            <Link
              href="/termsAndPrivacy"
              className="text-[12px] font-semibold tracking-widest text-[#4a4a4a] hover:text-black transition-colors py-2"
              onMouseEnter={() => handleMouseEnter("none")}
            >
              นโยบายและเงื่อนไข
            </Link>
          </div>

          <div className="flex md:hidden items-center">
            <button onClick={toggleMobileMenu} className="text-gray-800 focus:outline-none p-2">
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {activeMenu === "สินค้า" && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="absolute left-0 top-[calc(100%+8px)] w-full bg-white rounded-[10px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-40 hidden md:block overflow-hidden"
              onMouseEnter={() => handleMouseEnter("สินค้า")}
            >
              <div className="mx-auto max-w-7xl flex flex-col md:flex-row pt-8 pb-10 px-8 h-auto min-h-[420px]">
                <div className="w-[45%] flex flex-col justify-between pr-8">
                  <div className="flex flex-col space-y-5">
                      {menuGroups.map((group, index) => {
                        const withBorder = index < menuGroups.length - 1;
                        const isEnergyGroup = group.key === "mega.energy";

                        return (
                          <div key={group.key} className={withBorder ? "border-b border-gray-100 pb-5" : "pt-1"}>
                            <h3 className="text-[16px] text-gray-800 mb-2 font-medium tracking-wide">{group.title}</h3>
                            <ul className="space-y-1.5 pl-0">
                              {group.items.map((item) => {
                                const hoverImage = item.iconUrl?.trim() || defaultPreviewImage;

                                return (
                                  <li key={item.id}>
                                    <Link
                                      href={item.path}
                                      onMouseEnter={() => setPreviewImage(hoverImage)}
                                      className={`group flex items-center text-[14.5px] transition-colors ${
                                        isEnergyGroup ? "font-medium text-gray-800 hover:text-black" : "text-gray-500 hover:text-black"
                                      }`}
                                    >
                                      {isEnergyGroup && (
                                        <span className="bg-[#fcb900] p-[3px] rounded mr-3 text-black">
                                          <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                          </svg>
                                        </span>
                                      )}
                                      {item.label}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="w-[55%] pl-8 relative flex flex-col">
                  <div
                    className="w-full h-full rounded-xl overflow-hidden relative shadow-inner bg-stone-200"
                    style={{
                        backgroundImage: `url('${previewImage || defaultPreviewImage}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-stone-900/10"></div>
                  </div>
                </div>
              </div>

              {/* <div className="border-t border-gray-100 px-8 py-3 bg-[#fafaf8] flex items-center text-[12px] text-gray-500 space-x-6">
                <button className="flex items-center hover:text-black transition-colors font-medium">
                  <svg className="w-[16px] h-[16px] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Thailand THB
                  <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button className="flex items-center hover:text-black transition-colors font-medium">
                  <svg className="w-[16px] h-[16px] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  English
                  <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div> */}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="absolute left-0 top-[calc(100%+8px)] w-full rounded-[10px] md:hidden bg-white border border-gray-100 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-40"
            >
              <div className="py-2 px-6">
                {menuGroups.map((group) => (
                  <div key={`mobile-${group.key}`} className="border-b border-gray-100 py-3">
                    <p className="text-[13px] font-semibold text-gray-900">{group.title}</p>
                    <div className="mt-1 space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={`mobile-${item.id}`}
                          href={item.path}
                          className="block text-[13px] text-gray-600 hover:text-black"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                <Link href="/about" className="block py-3 text-[13px] font-semibold tracking-widest text-gray-900 border-b border-gray-100">
                  เกี่ยวกับเรา
                </Link>
                <Link href="/termsAndPrivacy" className="block py-3 text-[13px] font-semibold tracking-widest text-gray-900 text-left">
                  นโยบายและเงื่อนไข
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
