import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truefiberhome.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/home",
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
          "/stories",
        ],
        disallow: ["/dashboard", "/dashboard/*", "/login", "/api", "/api/*"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
