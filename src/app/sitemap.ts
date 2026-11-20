import type { MetadataRoute } from "next";
import { prisma } from "@/src/lib/prisma";
import { GUIDES } from "@/src/data/guides";
import { LISTED_AREAS, areaPath } from "@/src/lib/areas";
import { SITE_URL } from "@/src/lib/site";

const siteUrl = SITE_URL;

export const PUBLIC_SITE_ROUTES = [
  "/",
  "/boardband",
  "/areas",
  "/guides",
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
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const articles = await prisma.article
    .findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true, coverImage: true },
      orderBy: { updatedAt: "desc" },
      take: 5_000,
    })
    .catch(() => []);

  const routes: MetadataRoute.Sitemap = PUBLIC_SITE_ROUTES.map((route, index) => ({
    url: route === "/" ? siteUrl : `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: index === 0 ? "daily" : "weekly",
    priority: index === 0 ? 1 : 0.8,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/articles/${encodeURIComponent(article.slug)}`,
    lastModified: article.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
    images: article.coverImage ? [article.coverImage] : undefined,
  }));

  const areaRoutes: MetadataRoute.Sitemap = LISTED_AREAS.map((area) => ({
    url: `${siteUrl}${areaPath(area)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${siteUrl}/guides/${guide.slug}`,
    lastModified: new Date(guide.published),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...routes, ...areaRoutes, ...guideRoutes, ...articleRoutes];
}
