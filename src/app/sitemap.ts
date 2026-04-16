import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truefiberhome.com";

const routes = [
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
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route, index) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: index === 0 ? "daily" : "weekly",
    priority: index === 0 ? 1 : 0.8,
  }));
}
