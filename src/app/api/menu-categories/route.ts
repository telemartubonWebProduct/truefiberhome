import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { nullableString, safeBoolean, safeNumber } from "@/src/lib/api-normalize";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const items = await prisma.menuCategory.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/menu-categories failed:", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const iconUrl = nullableString(body.iconUrl);
    const text = nullableString(body.text);
    const path = nullableString(body.path);

    if (!iconUrl || !text || !path) {
      return NextResponse.json(
        { error: "iconUrl, text, and path are required" },
        { status: 400 }
      );
    }

    const alt = nullableString(body.alt) ?? text;

    const created = await prisma.menuCategory.create({
      data: {
        iconUrl,
        alt,
        text,
        path,
        displayOrder: safeNumber(body.displayOrder, 0),
        isActive: safeBoolean(body.isActive, true),
      },
    });

    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/menu-categories failed:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
