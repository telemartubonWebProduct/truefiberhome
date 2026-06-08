"use client";

import { useMemo } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LineIcon from "@/src/assets/icons/line-icon.svg";
import { useSiteSettings } from "@/src/context/SiteSettingsContext";
import { trackLineClick } from "@/src/lib/track-event";

interface FooterLinkItem {
  id: string;
  section: string;
  label: string;
  path: string;
  external: boolean;
  isActive?: boolean;
}

interface FooterProps {
  siteSettings?: {
    footerImageUrl?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  footerLinks?: FooterLinkItem[];
}

function normalizeSection(section: string) {
  return section.trim().toLowerCase();
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: FooterLinkItem[];
}) {
  return (
    <div>
      <h2 className="mb-4 text-base font-bold uppercase text-red-500">{title}</h2>
      <ul className="space-y-2 text-sm text-gray-300">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.path}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="transition-colors hover:text-white"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer({ siteSettings, footerLinks }: FooterProps) {
  const pathname = usePathname();
  const { lineSupportUrl } = useSiteSettings();
  const isHiddenRoute =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/backend") ||
    pathname?.startsWith("/login");

  const linksBySection = useMemo(() => {
    if (footerLinks && footerLinks.length > 0) {
      const grouped: Record<string, FooterLinkItem[]> = {};
      footerLinks
        .filter((item) => item.isActive !== false)
        .forEach((item) => {
          const key = normalizeSection(item.section);
          grouped[key] = grouped[key] || [];
          grouped[key].push(item);
        });
      return grouped;
    }

    return {
      company: [
        {
          id: "company-contact",
          section: "company",
          label: "ติดต่อเรา",
          path: "/service",
          external: false,
        },
      ],
      services: [
        {
          id: "services-internet",
          section: "services",
          label: "โปรเน็ตบ้าน",
          path: "/boardband",
          external: false,
        },
        {
          id: "services-mobile",
          section: "services",
          label: "แพ็กเกจมือถือ",
          path: "/monthly",
          external: false,
        },
        {
          id: "services-solar",
          section: "services",
          label: "โซล่าเซลล์",
          path: "/wEnergy",
          external: false,
        },
      ],
      support: [
        {
          id: "support-help",
          section: "support",
          label: "ศูนย์ช่วยเหลือ",
          path: lineSupportUrl || "/service",
          external: Boolean(lineSupportUrl),
        },
        {
          id: "support-privacy",
          section: "support",
          label: "นโยบายความเป็นส่วนตัว",
          path: "/privacy-policy",
          external: false,
        },
        {
          id: "support-terms",
          section: "support",
          label: "ข้อกำหนดการใช้งาน",
          path: "/terms-of-service",
          external: false,
        },
        {
          id: "support-phishing",
          section: "support",
          label: "ป้องกันการหลอกลวง",
          path: "/anti-phishing",
          external: false,
        },
      ],
    };
  }, [footerLinks, lineSupportUrl]);

  if (isHiddenRoute) return null;

  const phoneNumbers = siteSettings?.phone
    ? siteSettings.phone.split(",").map((phone) => phone.trim()).filter(Boolean)
    : ["0910192552", "0902518964", "0841041506"];

  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <FooterColumn title="Company" items={linksBySection.company ?? []} />
          <FooterColumn title="Services" items={linksBySection.services ?? []} />
          <FooterColumn title="Support" items={linksBySection.support ?? []} />

          <div>
            <h2 className="mb-4 text-base font-bold uppercase text-red-500">
              ติดต่อรับบริการ
            </h2>
            <a
              href={lineSupportUrl || "/service"}
              target={lineSupportUrl ? "_blank" : undefined}
              rel={lineSupportUrl ? "noopener noreferrer" : undefined}
              onClick={() => trackLineClick("footer", lineSupportUrl)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#00B900] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#009f00]"
            >
              <Image src={LineIcon} alt="" width={20} height={20} className="h-5 w-5" />
              @truefiberhome
            </a>

            {siteSettings?.footerImageUrl ? (
              <div className="mt-5">
                <Image
                  src={siteSettings.footerImageUrl}
                  alt="True Fiber Home"
                  width={180}
                  height={48}
                  className="h-12 w-auto object-contain"
                />
              </div>
            ) : null}

            <div className="mt-5 space-y-1 text-sm text-gray-300">
              {siteSettings?.email ? <p>อีเมล: {siteSettings.email}</p> : null}
              {phoneNumbers.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="block transition-colors hover:text-white"
                >
                  {phone}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center">
          <p className="mx-auto max-w-5xl text-xs leading-6 text-gray-400">
            เว็บไซต์นี้ดำเนินการโดย บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด
            ซึ่งเป็นตัวแทนจำหน่ายที่ได้รับการแต่งตั้งอย่างเป็นทางการ (Authorized Dealer)
            ไม่ใช่เว็บไซต์หลักของบริษัท ทรู คอร์ปอเรชั่น จำกัด (มหาชน)
            จัดทำขึ้นเพื่อนำเสนอแพ็กเกจและบริการติดตั้งเท่านั้น
          </p>
          <p className="mt-4 text-xs text-gray-500">
            © {new Date().getFullYear()} Telemart Communication Co., Ltd.
          </p>
        </div>
      </div>
    </footer>
  );
}
