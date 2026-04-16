"use client";

import React, { useMemo } from "react";
import { Container, Typography, Link, Box } from "@mui/material";
import { Grid } from "@mui/material";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSiteSettings } from "@/src/context/SiteSettingsContext";
import LineIcon from "@/public/assets/icons/line-icon.svg";

interface FooterLinkItem {
  id: string;
  section: string;
  label: string;
  path: string;
  external: boolean;
  isActive?: boolean;
}

interface FooterProps {
  siteSettings?: any;
  footerLinks?: FooterLinkItem[];
}

function normalizeSection(section: string) {
  return section.trim().toLowerCase();
}

export default function Footer({ siteSettings, footerLinks }: FooterProps) {
  const pathname = usePathname();
  const isHiddenRoute =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/backend") || pathname?.startsWith("/login");
  const { lineSupportUrl } = useSiteSettings();
  const lineDisplay = lineSupportUrl
    ? lineSupportUrl.replace(/^https?:\/\/(www\.)?/i, "")
    : "@341tmfte";

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
      company: [{ id: "company-contact", section: "company", label: "Contact", path: "/service", external: false }],
      services: [
        { id: "services-internet", section: "services", label: "Internet", path: "/topup", external: false },
        { id: "services-wifi", section: "services", label: "Wifi", path: "/boardband", external: false },
        { id: "services-solar", section: "services", label: "SolarCell", path: "/wEnergy", external: false },
      ],
      support: [
        {
          id: "support-help-center",
          section: "support",
          label: "Help Center",
          path: lineSupportUrl || "/service",
          external: Boolean(lineSupportUrl),
        },
        {
          id: "support-privacy",
          section: "support",
          label: "Privacy Policy",
          path: "/privacy-policy",
          external: false,
        },
        {
          id: "support-terms",
          section: "support",
          label: "Terms of Service",
          path: "/terms-of-service",
          external: false,
        },
        {
          id: "support-anti-phishing",
          section: "support",
          label: "Anti-Phishing",
          path: "/anti-phishing",
          external: false,
        },
      ],
    };
  }, [footerLinks, lineSupportUrl]);

  const companyLinks = linksBySection.company ?? [];
  const serviceLinks = linksBySection.services ?? [];
  const supportLinks = linksBySection.support ?? [];

  if (isHiddenRoute) return null;

  return (
    <footer className="bg-black text-white">
      <Container maxWidth="lg" className="py-10">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6" component="h2" className="mb-4 font-bold uppercase tracking-wider text-red-500">
              Company
            </Typography>
            <ul>
              {companyLinks.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    color="inherit"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="hover:text-gray-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6" component="h2" className="mb-4 font-bold uppercase tracking-wider text-red-500">
              Services
            </Typography>
            <ul>
              {serviceLinks.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    color="inherit"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="hover:text-gray-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6" component="h2" className="mb-4 font-bold uppercase tracking-wider text-red-500">
              Support
            </Typography>
            <ul>
              {supportLinks.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    color="inherit"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="hover:text-gray-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6" component="h2" className="mb-4 font-bold uppercase tracking-wider text-red-500">
              Follow Us
            </Typography>
            <Box className="flex flex-col space-y-4">
              <Box className="flex items-center space-x-2">
                <Link
                  href={lineSupportUrl || "/service"}
                  target={lineSupportUrl ? "_blank" : undefined}
                  rel={lineSupportUrl ? "noopener noreferrer" : undefined}
                  color="inherit"
                  className="flex items-center space-x-2 hover:text-gray-300"
                >
                  <motion.img
                    src="/assets/icons/line-icon.svg"
                    alt="ช่องทางติดต่อ Line ทางการ"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain"
                  />
                  <Typography variant="body1" sx={{ fontFamily: "Prompt" }} color="#ffffff">
                    Line: {lineDisplay}
                  </Typography>
                </Link>
              </Box>

              {siteSettings?.footerImageUrl && (
                <Box className="flex items-center mt-2">
                  <motion.img
                    src={siteSettings.footerImageUrl}
                    alt="Footer Logo"
                    className="h-12 object-contain"
                  />
                </Box>
              )}

              <Box className="mt-4">
                <Typography
                  variant="body1"
                  sx={{ fontFamily: "Prompt" }}
                  color="#ffffff"
                  className="mb-1 text-red-400 font-semibold"
                >
                  ติดต่อรับบริการ
                </Typography>
                {siteSettings?.email && (
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "Prompt" }}
                    color="#ffffff"
                    className="mb-1"
                  >
                    อีเมล: {siteSettings.email}
                  </Typography>
                )}
                {siteSettings?.phone ? (
                  siteSettings.phone.split(",").map((p: string, i: number) => (
                    <Typography key={i} variant="body2" sx={{ fontFamily: "Prompt" }} color="#ffffff">
                      {p.trim()}
                    </Typography>
                  ))
                ) : (
                  <>
                    <Typography sx={{ fontFamily: "Prompt" }} variant="body2" color="#ffffff">
                      0910192552
                    </Typography>
                    <Typography sx={{ fontFamily: "Prompt" }} variant="body2" color="#ffffff">
                      0902518964
                    </Typography>
                    <Typography sx={{ fontFamily: "Prompt" }} variant="body2" color="#ffffff">
                      0841041506
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box className="mt-8 border-t border-gray-700 pt-4 text-center">
          <Typography
            variant="body2"
            className="mb-4 text-gray-400 text-xs sm:text-sm max-w-4xl mx-auto leading-relaxed"
          >
            ข้อจำกัดความรับผิดชอบ (Disclaimer): เว็บไซต์นี้ดำเนินการโดย บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด ซึ่งเป็นตัวแทนจำหน่ายที่ได้รับการแต่งตั้งอย่างเป็นทางการ (Authorized Dealer)
            เว็บไซต์นี้ไม่ใช่เว็บไซต์หลักหรือบริษัทในเครือบริษัท ทรู คอร์ปอเรชั่น จำกัด (มหาชน) ทางเราจัดทำเว็บไซต์นี้ขึ้นเพื่อวัตถุประสงค์ในการนำเสนอแพ็กเกจและบริการติดตั้งเท่านั้น
          </Typography>
          <Typography variant="body2">
            &copy; {new Date().getFullYear()} Telemart Communication co.,ltd.
            copyright all. right reserved reserved.
          </Typography>
        </Box>
      </Container>
    </footer>
  );
}
