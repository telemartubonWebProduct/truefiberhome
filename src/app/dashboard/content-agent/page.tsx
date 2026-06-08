import { ensureContentAgentConfig } from "@/src/lib/content-agent";
import { prisma } from "@/src/lib/prisma";
import { ensureSiteContentAgentConfig } from "@/src/lib/site-content-agent";
import ContentAgentManager from "./components/ContentAgentManager";
import { ensureArticleAgentConfig } from "@/src/lib/article-content-agent";

export default async function ContentAgentPage() {
  const client = prisma as any;
  const [promotionConfig, siteContentConfig, articleConfig] = await Promise.all([
    ensureContentAgentConfig(),
    ensureSiteContentAgentConfig(),
    ensureArticleAgentConfig(),
  ]);

  const [
    promotionDrafts,
    siteContentDrafts,
    articleDrafts,
    promotionRuns,
    siteContentRuns,
    articleRuns,
  ] =
    await Promise.all([
      client.contentAgentDraft.findMany({
        where: {
          status: "PENDING",
          AND: [
            { NOT: { externalKey: { startsWith: "site-content:" } } },
            { NOT: { externalKey: { startsWith: "article:" } } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      client.contentAgentDraft.findMany({
        where: {
          status: "PENDING",
          externalKey: { startsWith: "site-content:" },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      client.contentAgentDraft.findMany({
        where: {
          status: "PENDING",
          externalKey: { startsWith: "article:" },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      client.contentAgentRun.findMany({
        where: {
          AND: [
            { NOT: { trigger: { contains: "SITE_CONTENT" } } },
            { NOT: { trigger: { contains: "ARTICLE" } } },
          ],
        },
        orderBy: { startedAt: "desc" },
        take: 12,
      }),
      client.contentAgentRun.findMany({
        where: { trigger: { contains: "SITE_CONTENT" } },
        orderBy: { startedAt: "desc" },
        take: 12,
      }),
      client.contentAgentRun.findMany({
        where: { trigger: { contains: "ARTICLE" } },
        orderBy: { startedAt: "desc" },
        take: 12,
      }),
    ]);

  const serialize = (value: unknown) => JSON.parse(JSON.stringify(value));

  return (
    <ContentAgentManager
      promotion={{
        settings: serialize(promotionConfig),
        drafts: serialize(promotionDrafts),
        runs: serialize(promotionRuns),
      }}
      siteContent={{
        settings: serialize(siteContentConfig),
        drafts: serialize(siteContentDrafts),
        runs: serialize(siteContentRuns),
      }}
      article={{
        settings: serialize(articleConfig),
        drafts: serialize(articleDrafts),
        runs: serialize(articleRuns),
      }}
    />
  );
}
