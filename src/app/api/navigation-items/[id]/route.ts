import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { nullableString, safeAssetUrl, safeBoolean, safeLink, safeNumber } from "@/src/lib/api-normalize";
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
      label?: string;
      path?: string;
      parentKey?: string | null;
      iconUrl?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    } = {};

    if ("label" in body) {
      const label = nullableString(body.label);
      if (!label) {
        return NextResponse.json({ error: "label cannot be empty" }, { status: 400 });
      }
      data.label = label;
    }

    if ("path" in body) {
      const path = safeLink(body.path);
      if (!path) {
        return NextResponse.json({ error: "path cannot be empty" }, { status: 400 });
      }
      data.path = path;
    }

    if ("parentKey" in body) {
      data.parentKey = nullableString(body.parentKey);
    }

    if ("iconUrl" in body) {
      const iconUrl = safeAssetUrl(body.iconUrl);
      if (body.iconUrl && !iconUrl) {
        return NextResponse.json({ error: "iconUrl format is invalid" }, { status: 400 });
      }
      data.iconUrl = iconUrl;
    }

    if ("displayOrder" in body) {
      data.displayOrder = safeNumber(body.displayOrder, 0);
    }

    if ("isActive" in body) {
      data.isActive = safeBoolean(body.isActive, true);
    }

    const updated = await prisma.navigationItem.update({
      where: { id },
      data,
    });

    revalidatePath("/", "layout");
    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/navigation-items/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update navigation item" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    await prisma.navigationItem.delete({ where: { id } });

    revalidatePath("/", "layout");
    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/navigation-items/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete navigation item" }, { status: 500 });
  }
}
