import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { nullableString, safeBoolean, safeNumber } from "@/src/lib/api-normalize";
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
    const body = await request.json();

    const data: {
      iconUrl?: string;
      alt?: string;
      text?: string;
      path?: string;
      displayOrder?: number;
      isActive?: boolean;
    } = {};

    if ("iconUrl" in body) {
      const iconUrl = nullableString(body.iconUrl);
      if (!iconUrl) {
        return NextResponse.json({ error: "iconUrl cannot be empty" }, { status: 400 });
      }
      data.iconUrl = iconUrl;
    }

    if ("alt" in body) {
      const alt = nullableString(body.alt);
      if (!alt) {
        return NextResponse.json({ error: "alt cannot be empty" }, { status: 400 });
      }
      data.alt = alt;
    }

    if ("text" in body) {
      const text = nullableString(body.text);
      if (!text) {
        return NextResponse.json({ error: "text cannot be empty" }, { status: 400 });
      }
      data.text = text;
    }

    if ("path" in body) {
      const path = nullableString(body.path);
      if (!path) {
        return NextResponse.json({ error: "path cannot be empty" }, { status: 400 });
      }
      data.path = path;
    }

    if ("displayOrder" in body) {
      data.displayOrder = safeNumber(body.displayOrder, 0);
    }

    if ("isActive" in body) {
      data.isActive = safeBoolean(body.isActive, true);
    }

    const updated = await prisma.menuCategory.update({
      where: { id },
      data,
    });

    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/menu-categories/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    await prisma.menuCategory.delete({ where: { id } });

    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/menu-categories/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
