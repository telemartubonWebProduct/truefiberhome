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

type Context = { params: Promise<{ id: string }> };

const VALID_LAYOUTS = new Set(["default", "full-width", "magazine", "minimal"]);

function normalizeLayout(value: unknown): string | undefined {
  if (typeof value === "string" && VALID_LAYOUTS.has(value)) {
    return value;
  }
  return undefined;
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

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const article = await prisma.article.findUnique({ where: { id } });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("GET /api/articles/[id] failed:", error);
    return NextResponse.json({ error: "Failed to load article" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const current = await prisma.article.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if ("title" in body) {
      const title = nullableString(body.title);
      if (!title) {
        return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
      }
      data.title = title;
    }

    if ("slug" in body) {
      const requested = nullableString(body.slug);
      const newSlug = requested ? slugify(requested) : current.slug;
      if (newSlug && newSlug !== current.slug) {
        const dup = await prisma.article.findUnique({ where: { slug: newSlug } });
        if (dup && dup.id !== id) {
          return NextResponse.json({ error: "slug already in use" }, { status: 409 });
        }
        data.slug = newSlug;
      }
    }

    if ("excerpt" in body) {
      data.excerpt = nullableString(body.excerpt);
    }

    let blocks: ReturnType<typeof normalizeBlocks> | null = null;
    if ("contentBlocks" in body) {
      blocks = normalizeBlocks(body.contentBlocks);
      data.contentBlocks = blocks.length > 0 ? (blocks as any) : null;
      if (blocks.length > 0) {
        data.content = blocksToHtml(blocks);
        if (!("readingTime" in body) || !safeNumber(body.readingTime, 0)) {
          data.readingTime = estimateReadingTimeFromBlocks(blocks);
        }
      }
    }

    if ("content" in body && (!blocks || blocks.length === 0)) {
      const content = safeString(body.content, "");
      if (!content.trim()) {
        return NextResponse.json({ error: "content cannot be empty" }, { status: 400 });
      }
      data.content = content;
      if (!("readingTime" in body) || !safeNumber(body.readingTime, 0)) {
        data.readingTime = estimateReadingTime(content);
      }
    }

    if ("coverImage" in body) {
      data.coverImage = nullableString(body.coverImage);
    }

    if ("category" in body) {
      data.category = nullableString(body.category);
    }

    if ("tags" in body) {
      const tags = normalizeTags(body.tags);
      data.tags = tags.length > 0 ? tags : null;
    }

    if ("layout" in body) {
      const layout = normalizeLayout(body.layout);
      if (layout) data.layout = layout;
    }

    if ("author" in body) {
      data.author = nullableString(body.author);
    }

    if ("readingTime" in body) {
      const rt = safeNumber(body.readingTime, 0);
      if (rt > 0) data.readingTime = rt;
    }

    if ("isPublished" in body) {
      const isPub = safeBoolean(body.isPublished, current.isPublished);
      data.isPublished = isPub;
      if (isPub && !current.publishedAt && !("publishedAt" in body)) {
        data.publishedAt = new Date();
      }
    }

    if ("isFeatured" in body) {
      data.isFeatured = safeBoolean(body.isFeatured, current.isFeatured);
    }

    if ("publishedAt" in body) {
      const dt = nullableString(body.publishedAt);
      if (dt) {
        const parsed = new Date(dt);
        data.publishedAt = Number.isNaN(parsed.getTime()) ? null : parsed;
      } else {
        data.publishedAt = null;
      }
    }

    if ("seoTitle" in body) {
      data.seoTitle = nullableString(body.seoTitle);
    }

    if ("seoDescription" in body) {
      data.seoDescription = nullableString(body.seoDescription);
    }

    if ("displayOrder" in body) {
      data.displayOrder = safeNumber(body.displayOrder, 0);
    }

    const updated = await prisma.article.update({
      where: { id },
      data,
    });

    revalidatePath("/articles");
    revalidatePath(`/articles/${current.slug}`);
    if (updated.slug !== current.slug) {
      revalidatePath(`/articles/${updated.slug}`);
    }
    revalidatePath("/dashboard/articles");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/articles/[id] failed:", error);
    const detail =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? error.message
        : undefined;
    return NextResponse.json(
      { error: "Failed to update article", detail },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const current = await prisma.article.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    await prisma.article.delete({ where: { id } });

    revalidatePath("/articles");
    revalidatePath(`/articles/${current.slug}`);
    revalidatePath("/dashboard/articles");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/articles/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
