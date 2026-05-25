import { prisma } from "@/src/lib/prisma";
import ArticleManager from "./components/ArticleManager";

export const dynamic = "force-dynamic";

export default async function DashboardArticlesPage() {
  const articleDelegate = (prisma as any).article;

  const articles = articleDelegate
    ? await articleDelegate.findMany({
        orderBy: [
          { isFeatured: "desc" },
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ],
      })
    : [];

  const serializable = JSON.parse(JSON.stringify(articles));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">บทความ &amp; ข่าวสาร</h1>
          <p className="text-gray-400 mt-1">
            จัดการคอนเทนต์บทความ พร้อมเลือกเลย์เอาต์การแสดงผลแบบกำหนดเองได้
          </p>
        </div>
      </div>

      <ArticleManager initialArticles={serializable} />
    </div>
  );
}
