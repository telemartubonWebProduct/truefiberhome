import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  nullableString,
  safeBoolean,
  safeNumber,
  toIntId,
} from "@/src/lib/api-normalize";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const bannerId = toIntId(id);
    if (!bannerId) {
      return NextResponse.json({ error: "Invalid banner id" }, { status: 400 });
    }

    const body = await request.json();

    const data: {
      title?: string | null;
      description?: string | null;
      imageUrl?: string;
      mobileImage?: string | null;
      linkUrl?: string | null;
      isActive?: boolean;
      displayOrder?: number;
    } = {};

    if ("title" in body) {
      data.title = nullableString(body.title);
    }

    if ("description" in body) {
      data.description = nullableString(body.description);
    }

    if ("imageUrl" in body) {
      const imageUrl = nullableString(body.imageUrl);
      if (!imageUrl) {
        return NextResponse.json({ error: "imageUrl cannot be empty" }, { status: 400 });
      }
      data.imageUrl = imageUrl;
    }

    if ("mobileImage" in body) {
      data.mobileImage = nullableString(body.mobileImage);
    }

    if ("linkUrl" in body) {
      data.linkUrl = nullableString(body.linkUrl);
    }

    if ("isActive" in body) {
      data.isActive = safeBoolean(body.isActive, true);
    }

    if ("displayOrder" in body) {
      data.displayOrder = safeNumber(body.displayOrder, 0);
    }

    const updated = await prisma.banner.update({
      where: { id: bannerId },
      data,
    });

    revalidatePath("/home");
    revalidatePath("/dashboard/banners");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/banners/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const bannerId = toIntId(id);
    if (!bannerId) {
      return NextResponse.json({ error: "Invalid banner id" }, { status: 400 });
    }

    await prisma.banner.delete({ where: { id: bannerId } });

    revalidatePath("/home");
    revalidatePath("/dashboard/banners");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/banners/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
