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
    const items = await prisma.navigationItem.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/navigation-items failed:", error);
    return NextResponse.json({ error: "Failed to load navigation items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const label = nullableString(body.label);
    const path = safeLink(body.path);
    const iconUrl = safeAssetUrl(body.iconUrl);

    if (!label || !path) {
      return NextResponse.json(
        { error: "label and path are required" },
        { status: 400 }
      );
    }

    if ("iconUrl" in body && body.iconUrl && !iconUrl) {
      return NextResponse.json({ error: "iconUrl format is invalid" }, { status: 400 });
    }

    const created = await prisma.navigationItem.create({
      data: {
        label,
        path,
        parentKey: nullableString(body.parentKey),
        iconUrl,
        displayOrder: safeNumber(body.displayOrder, 0),
        isActive: safeBoolean(body.isActive, true),
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/navigation-items failed:", error);
    return NextResponse.json({ error: "Failed to create navigation item" }, { status: 500 });
  }
}
