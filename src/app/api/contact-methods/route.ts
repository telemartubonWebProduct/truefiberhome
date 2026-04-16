import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { nullableString, safeAssetUrl, safeBoolean, safeLink, safeNumber } from "@/src/lib/api-normalize";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const contactMethodDelegate = (prisma as any).contactMethod;
    if (!contactMethodDelegate) {
      return NextResponse.json([]);
    }

    const methods = await contactMethodDelegate.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(methods);
  } catch (error) {
    console.error("GET /api/contact-methods failed:", error);
    return NextResponse.json({ error: "Failed to load contact methods" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const key = nullableString(body.key);
    const title = nullableString(body.title);
    const href = safeLink(body.href);
    const iconUrl = safeAssetUrl(body.iconUrl);

    if (!key || !title || !href) {
      return NextResponse.json(
        { error: "key, title, and href are required" },
        { status: 400 }
      );
    }

    if ("iconUrl" in body && body.iconUrl && !iconUrl) {
      return NextResponse.json({ error: "iconUrl format is invalid" }, { status: 400 });
    }

    const contactMethodDelegate = (prisma as any).contactMethod;
    if (!contactMethodDelegate) {
      return NextResponse.json(
        { error: "ContactMethod model is unavailable. Please run Prisma generate and restart dev server." },
        { status: 500 }
      );
    }

    const created = await contactMethodDelegate.create({
      data: {
        key,
        title,
        href,
        description: nullableString(body.description),
        iconUrl,
        colorClass: nullableString(body.colorClass),
        displayOrder: safeNumber(body.displayOrder, 0),
        isActive: safeBoolean(body.isActive, true),
      },
    });

    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/contact-methods failed:", error);
    return NextResponse.json({ error: "Failed to create contact method" }, { status: 500 });
  }
}
