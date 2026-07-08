"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

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
  "https://images.contentstack.io/v3/assets/blt8ba403bee4433fd8/blt7e0dd3ed6dad1acd/6a0fb7339af2622baffee5e4/trueonline-home-next-1080x1080.jpg";
const DEFAULT_LOGO_IMAGE = "/assets/Trueonline-logo.svg.png";

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
      "https://images.contentstack.io/v3/assets/blt8ba403bee4433fd8/blt040771c058a482ff/691c98197a665989eb2fa25b/pack-card-tol-starter.jpg",
    displayOrder: 0,
    isActive: true,
  },
  {
    id: "fallback-broadband-2",
    label: "บริการติดตั้งและย้ายจุด",
    path: "/service",
    parentKey: "mega.broadband",
    iconUrl:
      "https://images.contentstack.io/v3/assets/blt8ba403bee4433fd8/blt8d9cf6c2de6d28f2/69c3565b58c98c757d814a58/tol-thumbnail-fiber-to-room-560x314.jpg",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "fallback-mobile-1",
    label: "เติมเงิน",
    path: "/topup",
    parentKey: "mega.mobile",
    iconUrl:
      DEFAULT_PREVIEW_IMAGE,
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "fallback-mobile-2",
    label: "รายเดือน",
    path: "/monthly",
    parentKey: "mega.mobile",
    iconUrl:
      DEFAULT_PREVIEW_IMAGE,
    displayOrder: 3,
    isActive: true,
  },
  {
    id: "fallback-energy-1",
    label: "โซล่าเซลล์ W&W Energy",
    path: "/wEnergy",
    parentKey: "mega.energy",
    iconUrl:
      "https://images.contentstack.io/v3/assets/blt8ba403bee4433fd8/blt2e07ec23378532d2/698c659b206ddc2a6b398a33/TOL_True_X_Solar_Banner_3840_x_1236.jpg",
    displayOrder: 4,
    isActive: true,
  },
  {
    id: "fallback-service-1",
    label: "บริการและสอบถามทั้งหมด",
    path: "/service",
    parentKey: "mega.service",
    iconUrl:
      "https://images.contentstack.io/v3/assets/blt8ba403bee4433fd8/blt8d9cf6c2de6d28f2/69c3565b58c98c757d814a58/tol-thumbnail-fiber-to-room-560x314.jpg",
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
  const closeMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const handleMouseEnter = (menu: string) => {
    if (closeMenuTimer.current) {
      clearTimeout(closeMenuTimer.current);
      closeMenuTimer.current = null;
    }
    setActiveMenu(menu);
  };
  const handleMouseLeave = () => {
    closeMenuTimer.current = setTimeout(() => {
      setActiveMenu(null);
      closeMenuTimer.current = null;
    }, 180);
  };

  useEffect(() => {
    if (activeMenu === "สินค้า") {
      setPreviewImage(defaultPreviewImage);
    }
  }, [activeMenu, defaultPreviewImage]);

  useEffect(
    () => () => {
      if (closeMenuTimer.current) clearTimeout(closeMenuTimer.current);
    },
    [],
  );

  if (isHiddenRoute) return null;

  return (
    <header
      className="fixed top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4"
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-full max-w-[900px] bg-white rounded-[10px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] pointer-events-auto relative border border-gray-100">
        <nav className="flex items-center justify-between px-6 py-2.5 lg:px-8 relative z-50">
          <div className="flex items-center">
            <Link
              href="/home"
              aria-label="true online - ตัวแทนจำหน่ายทรูที่ได้รับอนุญาต กลับหน้าหลัก"
              className="flex flex-col items-start gap-[3px]"
            >
              <Image
                src={siteSettings?.logoUrl?.trim() || DEFAULT_LOGO_IMAGE}
                alt="true online - Authorized True Partner"
                width={138}
                height={27}
                priority
                className="h-auto w-[120px] object-contain object-left"
              />
              
            </Link>
          </div>

          <div className="hidden md:flex flex-1 items-center justify-center space-x-10">
            <button
              type="button"
              className="flex h-full items-center py-2"
              onMouseEnter={() => handleMouseEnter("สินค้า")}
              onFocus={() => handleMouseEnter("สินค้า")}
              onClick={() =>
                setActiveMenu((current) =>
                  current === "สินค้า" ? null : "สินค้า"
                )
              }
              aria-expanded={activeMenu === "สินค้า"}
              aria-controls="desktop-product-menu"
            >
              <span className="text-[12px] font-semibold tracking-widest text-[#4a4a4a] hover:text-black flex items-center transition-colors">
                สินค้า
                <svg className="ml-1 h-[14px] w-[14px] transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            <Link
              href="/about"
              className="text-[12px] font-semibold tracking-widest text-[#4a4a4a] hover:text-black transition-colors py-2"
              onMouseEnter={() => handleMouseEnter("none")}
            >
              เกี่ยวกับ
            </Link>
            <Link
              href="/articles"
              className="text-[12px] font-semibold tracking-widest text-[#4a4a4a] hover:text-black transition-colors py-2"
              onMouseEnter={() => handleMouseEnter("none")}
            >
              บทความ
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
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
              aria-expanded={isMobileMenuOpen}
              className="p-2 text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
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

        {activeMenu === "สินค้า" && (
          <div
            id="desktop-product-menu"
            className="absolute left-0 top-full z-40 hidden w-full pt-2 md:block"
            onMouseEnter={() => handleMouseEnter("สินค้า")}
          >
            <div className="w-full overflow-hidden rounded-[10px] border border-gray-100 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
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
                  <div className="w-full h-full rounded-xl overflow-hidden relative shadow-inner bg-stone-200">
                    <Image
                      src={previewImage || defaultPreviewImage}
                      alt=""
                      aria-hidden
                      fill
                      sizes="460px"
                      className="object-cover"
                    />
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
            </div>
          </div>
        )}

        {isMobileMenuOpen && (
            <div
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
                <Link href="/articles" className="block py-3 text-[13px] font-semibold tracking-widest text-gray-900 border-b border-gray-100">
                  บทความ
                </Link>
                <Link href="/termsAndPrivacy" className="block py-3 text-[13px] font-semibold tracking-widest text-gray-900 text-left">
                  นโยบายและเงื่อนไข
                </Link>
              </div>
            </div>
        )}
      </div>
    </header>
  );
}
