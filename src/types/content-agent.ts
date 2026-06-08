export type ContentAgentBenefit = {
  label: string;
  imageUrl: string | null;
};

export type ContentAgentPackagePayload = {
  externalKey: string;
  code: string;
  name: string;
  type: string;
  downloadMbps: number;
  uploadMbps: number;
  speed: string;
  price: number;
  priceNote: string | null;
  contractMonths: number | null;
  promoBadge: string | null;
  benefits: ContentAgentBenefit[];
  imageUrl: string | null;
  sourceUrl: string;
};

export type ContentAgentScope = "promotion" | "site-content" | "article";

export type SiteContentTargetType = "HOME_SECTION" | "BANNER";

export type SiteContentAgentPayload = {
  externalKey: string;
  targetType: SiteContentTargetType;
  targetKey: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  imageAlt: string | null;
  imageMatchReason: string | null;
  imageConfidence: number;
  linkUrl: string | null;
  sourceUrl: string;
};

export type ArticleAgentSection = {
  heading: string;
  paragraphs: string[];
  bullets: string[];
};

export type ArticleAgentPayload = {
  externalKey: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  primaryKeyword: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  imageMatchReason: string | null;
  imageConfidence: number;
  sections: ArticleAgentSection[];
  ctaLabel: string;
  ctaUrl: string;
  sourceUrls: string[];
};

export type ContentAgentRunResult = {
  runId?: string;
  status: "SUCCEEDED" | "FAILED" | "SKIPPED";
  discoveredCount: number;
  draftCount: number;
  publishedCount: number;
  message?: string;
};
