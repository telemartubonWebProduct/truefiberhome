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
      key?: string;
      title?: string;
      description?: string | null;
      iconUrl?: string | null;
      href?: string;
      colorClass?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    } = {};

    if ("key" in body) {
      const key = nullableString(body.key);
      if (!key) {
        return NextResponse.json({ error: "key cannot be empty" }, { status: 400 });
      }
      data.key = key;
    }

    if ("title" in body) {
      const title = nullableString(body.title);
      if (!title) {
        return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
      }
      data.title = title;
    }

    if ("description" in body) {
      data.description = nullableString(body.description);
    }

    if ("iconUrl" in body) {
      const iconUrl = safeAssetUrl(body.iconUrl);
      if (body.iconUrl && !iconUrl) {
        return NextResponse.json({ error: "iconUrl format is invalid" }, { status: 400 });
      }
      data.iconUrl = iconUrl;
    }

    if ("href" in body) {
      const href = safeLink(body.href);
      if (!href) {
        return NextResponse.json({ error: "href cannot be empty" }, { status: 400 });
      }
      data.href = href;
    }

    if ("colorClass" in body) {
      data.colorClass = nullableString(body.colorClass);
    }

    if ("displayOrder" in body) {
      data.displayOrder = safeNumber(body.displayOrder, 0);
    }

    if ("isActive" in body) {
      data.isActive = safeBoolean(body.isActive, true);
    }

    const contactMethodDelegate = (prisma as any).contactMethod;
    if (!contactMethodDelegate) {
      return NextResponse.json(
        { error: "ContactMethod model is unavailable. Please run Prisma generate and restart dev server." },
        { status: 500 }
      );
    }

    const updated = await contactMethodDelegate.update({
      where: { id },
      data,
    });

    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/contact-methods/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update contact method" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    const contactMethodDelegate = (prisma as any).contactMethod;
    if (!contactMethodDelegate) {
      return NextResponse.json(
        { error: "ContactMethod model is unavailable. Please run Prisma generate and restart dev server." },
        { status: 500 }
      );
    }

    await contactMethodDelegate.delete({ where: { id } });

    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/contact-methods/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete contact method" }, { status: 500 });
  }
}
