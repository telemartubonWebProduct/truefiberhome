import type { MetadataRoute } from "next";

import { SITE_URL } from "@/src/lib/site";

const siteUrl = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/boardband",
          "/topup",
          "/monthly",
          "/wEnergy",
          "/service",
          "/termsAndPrivacy",
          "/privacy-policy",
          "/terms-of-service",
          "/anti-phishing",
          "/about",
          "/articles",
          "/articles/*",
        ],
        disallow: ["/dashboard", "/dashboard/*", "/login", "/api", "/api/*"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
