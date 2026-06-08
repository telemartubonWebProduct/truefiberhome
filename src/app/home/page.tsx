import type { Metadata } from "next";
import AutoLoopBanner from "./components/AutoLoopBanner";
import InstallPromotion from "./components/InstallPromotion";
import LazyHeroVideo from "./components/LazyHeroVideo";
import DeferredHomeSections from "./components/DeferredHomeSections";
import { prisma } from "@/src/lib/prisma";
import { lineSupport } from "@/src/context/line-path";
import { safeLink } from "@/src/lib/api-normalize";

const DEFAULT_HOME_POSTER =
  "https://images.contentstack.io/v3/assets/blt8ba403bee4433fd8/blt4d83aa3b25f95d9b/6a0fb734a8e61ade616dcaab/trueonline-home-next-3840x1236.png";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "แพ็กเกจเน็ตบ้าน มือถือ และบริการติดตั้ง",
  description:
    "หน้าแรก True Fiber Home รวมแพ็กเกจเน็ตบ้าน ซิมมือถือ โปรโมชั่น และช่องทางสมัครบริการโดยทีมงานผู้เชี่ยวชาญ",
  alternates: { canonical: "/home" },
  openGraph: {
    title: "True Fiber Home | แพ็กเกจเน็ตบ้าน มือถือ และบริการติดตั้ง",
    description:
      "รวมแพ็กเกจยอดนิยมพร้อมช่องทางติดต่อที่ตรวจสอบได้ และข้อมูลนโยบายความเป็นส่วนตัวที่ชัดเจน",
    url: "/home",
    type: "website",
    images: [
      {
        url: DEFAULT_HOME_POSTER,
        width: 1200,
        height: 386,
        alt: "แพ็กเกจและบริการอินเทอร์เน็ตบ้าน True Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "True Fiber Home | แพ็กเกจเน็ตบ้าน มือถือ และบริการติดตั้ง",
    description: "รวมแพ็กเกจยอดนิยม พร้อมทีมงานดูแลและช่องทางสมัครที่ปลอดภัย",
    images: [DEFAULT_HOME_POSTER],
  },
};

export default async function HomePage() {
  const homeSectionDelegate = (prisma as any).homeSection;
  const bannerDelegate = (prisma as any).banner;
  const packageDelegate = (prisma as any).package;
  const contactMethodDelegate = (prisma as any).contactMethod;
  const agentDelegate = (prisma as any).agent;

  const [
    heroSection,
    installPromotionSection,
    promotionPresentSection,
    contactSection,
    banners,
    packages,
    contactMethods,
    agents,
  ] = await Promise.all([
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homeHeroVideo" } }) : null,
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homeInstallPromotion" } }) : null,
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homePromotionPresent" } }) : null,
    homeSectionDelegate ? homeSectionDelegate.findUnique({ where: { sectionKey: "homeContactSection" } }) : null,
    bannerDelegate
      ? bannerDelegate.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } })
      : [],
    packageDelegate
      ? packageDelegate.findMany({ where: { status: true }, orderBy: { displayOrder: "asc" } })
      : [],
    contactMethodDelegate
      ? contactMethodDelegate.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } })
      : [],
    agentDelegate
      ? agentDelegate.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } })
      : [],
  ]);

  const fallbackTitle = "สัมผัสความเร็วเหนือระดับ กับเน็ตทรูไฟเบอร์";
  const fallbackSubtitle =
    "ลื่นไหล ไม่มีสะดุด ตอบโจทย์ทุกไลฟ์สไตล์ ทั้งทำงาน ดูหนัง เล่นเกม พร้อมเต็มอิ่มกับความบันเทิงระดับพรีเมียม";
  const fallbackVideoUrl = "/assets/mock-vid-main.mp4";

  const heroTitle = heroSection?.title || fallbackTitle;
  const heroSubtitle = heroSection?.subtitle || fallbackSubtitle;
  const heroVideoUrl = heroSection?.imageUrl || fallbackVideoUrl;
  const heroVisible = heroSection?.isActive ?? true;

  let buttonLabel = "สมัครเลยวันนี้";
  let buttonHref = lineSupport;

  if (heroSection?.jsonData && typeof heroSection.jsonData === "object" && !Array.isArray(heroSection.jsonData)) {
    const data = heroSection.jsonData as Record<string, unknown>;
    if (typeof data.buttonLabel === "string") buttonLabel = data.buttonLabel;
    if (typeof data.buttonHref === "string") {
      const normalizedHref = data.buttonHref.trim();
      if (normalizedHref && normalizedHref !== "/service" && normalizedHref !== "#") {
        buttonHref = safeLink(normalizedHref) || buttonHref;
      }
    }
  }

  const installTitle = installPromotionSection?.title || "ติดเน็ตทรูไฟเบอร์\nเร็ว แรง ครบทุกพื้นที่";
  const installTopLine = installPromotionSection?.subtitle || "สมัครง่าย ติดตั้งไว เริ่มต้นเพียง";
  const installIsActive = installPromotionSection?.isActive ?? true;

  let installPriceText = "499 บาท/เดือน";
  let installBottomLine = "ทีมงานดูแลครบ จบในที่เดียว";
  let installPrimaryButtonLabel = "ตรวจสอบพื้นที่ทางไลน์";
  let installPrimaryButtonHref = lineSupport;
  let installSecondaryButtonLabel = "ดูแพ็กเกจ";
  let installSecondaryButtonHref =
    safeLink(installPromotionSection?.linkUrl) || "/boardband";
  let installFooterText = "ติดตั้งทั่วไทย | ทีมงานมืออาชีพ | บริการรวดเร็ว";

  if (
    installPromotionSection?.jsonData &&
    typeof installPromotionSection.jsonData === "object" &&
    !Array.isArray(installPromotionSection.jsonData)
  ) {
    const data = installPromotionSection.jsonData as Record<string, unknown>;
    if (typeof data.priceText === "string") installPriceText = data.priceText;
    if (typeof data.bottomLine === "string") installBottomLine = data.bottomLine;
    if (typeof data.primaryButtonLabel === "string") installPrimaryButtonLabel = data.primaryButtonLabel;
    if (typeof data.primaryButtonHref === "string") {
      const normalizedHref = data.primaryButtonHref.trim();
      if (normalizedHref && normalizedHref !== "/service" && normalizedHref !== "#") {
        installPrimaryButtonHref = normalizedHref;
      }
    }
    if (typeof data.secondaryButtonLabel === "string") installSecondaryButtonLabel = data.secondaryButtonLabel;
    if (typeof data.secondaryButtonHref === "string") {
      installSecondaryButtonHref =
        safeLink(data.secondaryButtonHref) || installSecondaryButtonHref;
    }
    if (typeof data.footerText === "string") installFooterText = data.footerText;
  }

  const promotionPresentHelperText = promotionPresentSection?.subtitle || "เลื่อนเพื่อดูโปรโมชันทั้งหมด";
  const promotionPresentVisible = promotionPresentSection?.isActive ?? true;

  const mapGiftImage = (label: string) => {
    const text = label.toLowerCase();
    if (text.includes("router")) return "/assets/gifts/router.webp";
    if (text.includes("ติดตั้ง") || text.includes("install")) return "/assets/gifts/install.webp";
    if (text.includes("mesh")) return "/assets/gifts/mesh.webp";
    return undefined;
  };

  const getFreebieItems = (value: unknown) => {
    const items: Array<{ label: string; imageUrl?: string }> = [];

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") {
          const label = item.trim();
          if (label) items.push({ label });
          return;
        }

        if (item && typeof item === "object" && !Array.isArray(item)) {
          const data = item as Record<string, unknown>;
          const labelRaw = data.label ?? data.text ?? data.name;
          const imageRaw = data.imageUrl ?? data.image;
          const label = typeof labelRaw === "string" ? labelRaw.trim() : "";
          const imageUrl = typeof imageRaw === "string" ? imageRaw : undefined;
          if (label) items.push({ label, imageUrl });
        }
      });

      return items;
    }

    if (typeof value === "string" && value.trim()) {
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((label) => items.push({ label }));

      return items;
    }

    return items;
  };

  const promotionPackages = (packages as any[]).map((pkg, index) => {
    const freebieItems = getFreebieItems(pkg.freebie);
    const freebies = freebieItems.map((item) => item.label);
    const priceNumber = Number(pkg.price ?? 0);

    return {
      id: pkg.id ?? `pkg-${index}`,
      tag: pkg.code || `Package ${index + 1}`,
      name: pkg.name || "แพ็กเกจมาตรฐาน",
      imageUrl: typeof pkg.imageUrl === "string" ? pkg.imageUrl : undefined,
      speed: pkg.speed || "-",
      price: Number.isFinite(priceNumber)
        ? Number.isInteger(priceNumber)
          ? String(priceNumber)
          : priceNumber.toFixed(2)
        : "0",
      freebies,
      gifts: freebieItems.map((item) => ({
        label: item.label,
        image: item.imageUrl || mapGiftImage(item.label),
      })),
      buyUrl:
        typeof pkg.buyUrl === "string" && pkg.buyUrl.trim() && pkg.buyUrl.trim() !== "/service" && pkg.buyUrl.trim() !== "#"
          ? pkg.buyUrl.trim()
          : lineSupport,
    };
  });

  const autoLoopBanners = (banners as any[]).map((banner, index) => ({
    id: banner.id ?? `banner-${index}`,
    title: typeof banner.title === "string" ? banner.title : null,
    description: typeof banner.description === "string" ? banner.description : null,
    imageUrl: typeof banner.imageUrl === "string" ? banner.imageUrl : null,
    mobileImage: typeof banner.mobileImage === "string" ? banner.mobileImage : null,
  }));

  const contactTitle = contactSection?.title || "ติดต่อและสมัครบริการ";
  const contactSubtitle = contactSection?.subtitle || "เลือกช่องทางที่สะดวก ทีมงานพร้อมดูแลทันที";
  const contactVisible = contactSection?.isActive ?? true;
  const contactSectionId = "home-contact-section";

  const displayContactMethods = (contactMethods as any[]).map((item, index) => ({
    id: item.id ?? `contact-${index}`,
    key: typeof item.key === "string" ? item.key : "phone",
    title: typeof item.title === "string" ? item.title : "ช่องทางติดต่อ",
    desc: typeof item.description === "string" ? item.description : "ติดต่อทีมงานของเราได้ทันที",
    href:
      typeof item.href === "string" && item.href.trim() && item.href.trim() !== "/service" && item.href.trim() !== "#"
        ? item.href.trim()
        : lineSupport,
    iconUrl: typeof item.iconUrl === "string" ? item.iconUrl : null,
    colorClass: typeof item.colorClass === "string" ? item.colorClass : null,
  }));

  const packageStructuredData =
    promotionPackages.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "แพ็กเกจเน็ตบ้าน True Online",
          itemListElement: promotionPackages.slice(0, 12).map((pkg, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              name: pkg.name,
              category: pkg.tag,
              image: pkg.imageUrl || undefined,
              description: `${pkg.speed} Mbps ${pkg.freebies.join(" ")}`.trim(),
              offers: {
                "@type": "Offer",
                priceCurrency: "THB",
                price: pkg.price,
                url: safeLink(pkg.buyUrl) || "/boardband",
                availability: "https://schema.org/InStock",
              },
            },
          })),
        }
      : null;

  return (
    <>
      {packageStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(packageStructuredData) }}
        />
      ) : null}
      <div className="flex min-h-screen flex-col bg-white p-2 md:p-4">
        <div className="mt-20 flex min-h-[80vh] flex-1 flex-col gap-2 md:gap-4 lg:mt-0 lg:flex-row">
          {heroVisible && (
            <section className="relative min-h-[400px] flex-1 overflow-hidden rounded-xl">
              <LazyHeroVideo
                src={heroVideoUrl}
                poster={autoLoopBanners[0]?.imageUrl || DEFAULT_HOME_POSTER}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 p-6 text-center sm:p-8 md:p-12">
                <div className="flex max-w-[34rem] flex-col items-center gap-4 md:gap-6">
                  <h1 className="text-[1.9rem] leading-[1.2] font-bold text-white [text-shadow:0_4px_10px_rgba(0,0,0,0.3)] sm:text-[2.4rem] md:text-5xl md:leading-[1.15]">
                    {heroTitle}
                  </h1>
                  <p className="text-[0.95rem] leading-[1.6] text-white/90 sm:text-[1.05rem] md:text-[1.15rem] md:leading-[1.7]">
                    {heroSubtitle}
                  </p>
                  <a
                    href={buttonHref}
                    className="inline-flex w-full max-w-72 items-center justify-center rounded-full border border-white/25 bg-[#ff5346] px-6 py-3 text-[0.95rem] font-bold text-white shadow-[0_10px_28px_rgba(255,59,59,0.38)] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#f0443a] hover:shadow-[0_14px_32px_rgba(255,59,59,0.5)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-0 sm:w-auto sm:max-w-none sm:px-7 sm:text-[1.05rem]"
                  >
                    {buttonLabel}
                  </a>
                </div>
              </div>
            </section>
          )}

          <div className="flex flex-1 flex-col gap-2 md:gap-4">
            <AutoLoopBanner banners={autoLoopBanners} />
            <InstallPromotion
              content={{
                title: installTitle,
                topLine: installTopLine,
                priceText: installPriceText,
                bottomLine: installBottomLine,
                primaryButtonLabel: installPrimaryButtonLabel,
                primaryButtonHref: installPrimaryButtonHref,
                secondaryButtonLabel: installSecondaryButtonLabel,
                secondaryButtonHref: installSecondaryButtonHref,
                footerText: installFooterText,
                isActive: installIsActive,
              }}
            />
          </div>
        </div>
      </div>

      <DeferredHomeSections
        promotionProps={{
          packages: promotionPackages,
          helperText: promotionPresentHelperText,
          isActive: promotionPresentVisible,
          contactSectionId,
          contactMethods: displayContactMethods,
        }}
        agents={agents as any[]}
        contactProps={{
          sectionId: contactSectionId,
          content: {
            title: contactTitle,
            subtitle: contactSubtitle,
            isActive: contactVisible,
          },
          methods: displayContactMethods,
        }}
      />
    </>
  );
}
