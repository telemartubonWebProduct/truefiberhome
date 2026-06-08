import type { MetadataRoute } from "next";
import { prisma } from "@/src/lib/prisma";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.truefiberhome.com";

export const PUBLIC_SITE_ROUTES = [
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
    url: `${siteUrl}${route}`,
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

  return [...routes, ...articleRoutes];
}
