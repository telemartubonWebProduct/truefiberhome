import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { nullableString, safeBoolean, safeLink, safeNumber } from "@/src/lib/api-normalize";
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
      section?: string;
      label?: string;
      path?: string;
      external?: boolean;
      displayOrder?: number;
      isActive?: boolean;
    } = {};

    if ("section" in body) {
      const section = nullableString(body.section);
      if (!section) {
        return NextResponse.json({ error: "section cannot be empty" }, { status: 400 });
      }
      data.section = section;
    }

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

    if ("external" in body) {
      data.external = safeBoolean(body.external, false);
    }

    if ("displayOrder" in body) {
      data.displayOrder = safeNumber(body.displayOrder, 0);
    }

    if ("isActive" in body) {
      data.isActive = safeBoolean(body.isActive, true);
    }

    const updated = await prisma.footerLink.update({
      where: { id },
      data,
    });

    revalidatePath("/", "layout");
    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/footer-links/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update footer link" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    await prisma.footerLink.delete({ where: { id } });

    revalidatePath("/", "layout");
    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/footer-links/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete footer link" }, { status: 500 });
  }
}
