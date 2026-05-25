import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  nullableString,
  safeBoolean,
  safeNumber,
  safeString,
} from "@/src/lib/api-normalize";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";
import {
  blocksToHtml,
  estimateReadingTimeFromBlocks,
  normalizeBlocks,
} from "@/src/lib/article-blocks";

const VALID_LAYOUTS = new Set(["default", "full-width", "magazine", "minimal"]);

function normalizeLayout(value: unknown): string {
  if (typeof value === "string" && VALID_LAYOUTS.has(value)) {
    return value;
  }
  return "default";
}

function slugify(input: string): string {
  return input
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9฀-๿-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get("admin") === "1";

    if (isAdmin) {
      const auth = await requireDashboardUser();
      if (auth.response) {
        return auth.response;
      }
    }

    const where: any = isAdmin ? {} : { isPublished: true };

    const articles = await prisma.article.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("GET /api/articles failed:", error);
    return NextResponse.json({ error: "Failed to load articles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const title = nullableString(body.title);
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const blocks = normalizeBlocks(body.contentBlocks);
    let content = safeString(body.content, "");
    if (blocks.length > 0) {
      content = blocksToHtml(blocks);
    }
    if (!content.trim() && blocks.length === 0) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    let slug = nullableString(body.slug);
    if (!slug) {
      slug = slugify(title);
    } else {
      slug = slugify(slug);
    }
    if (!slug) {
      slug = `article-${Date.now()}`;
    }

    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const tags = normalizeTags(body.tags);
    const isPublished = safeBoolean(body.isPublished, false);
    const publishedAtInput = nullableString(body.publishedAt);
    const publishedAt = publishedAtInput
      ? new Date(publishedAtInput)
      : isPublished
        ? new Date()
        : null;

    const readingTime =
      safeNumber(body.readingTime, 0) > 0
        ? safeNumber(body.readingTime, 0)
        : blocks.length > 0
          ? estimateReadingTimeFromBlocks(blocks)
          : estimateReadingTime(content);

    const created = await prisma.article.create({
      data: {
        title,
        slug,
        excerpt: nullableString(body.excerpt),
        content,
        contentBlocks: blocks.length > 0 ? (blocks as any) : undefined,
        coverImage: nullableString(body.coverImage),
        category: nullableString(body.category),
        tags: tags.length > 0 ? tags : undefined,
        layout: normalizeLayout(body.layout),
        author: nullableString(body.author),
        readingTime,
        isPublished,
        isFeatured: safeBoolean(body.isFeatured, false),
        publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
        seoTitle: nullableString(body.seoTitle),
        seoDescription: nullableString(body.seoDescription),
        displayOrder: safeNumber(body.displayOrder, 0),
      },
    });

    revalidatePath("/articles");
    revalidatePath(`/articles/${created.slug}`);
    revalidatePath("/dashboard/articles");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/articles failed:", error);
    const detail =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.message
        : undefined;
    return NextResponse.json(
      { error: "Failed to create article", detail },
      { status: 500 }
    );
  }
}
