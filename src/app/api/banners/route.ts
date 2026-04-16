import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  nullableString,
  safeBoolean,
  safeNumber,
} from "@/src/lib/api-normalize";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const banners = await prisma.banner.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("GET /api/banners failed:", error);
    return NextResponse.json({ error: "Failed to load banners" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const imageUrl = nullableString(body.imageUrl);
    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const created = await prisma.banner.create({
      data: {
        title: nullableString(body.title),
        description: nullableString(body.description),
        imageUrl,
        mobileImage: nullableString(body.mobileImage),
        linkUrl: nullableString(body.linkUrl),
        isActive: safeBoolean(body.isActive, true),
        displayOrder: safeNumber(body.displayOrder, 0),
      },
    });

    revalidatePath("/home");
    revalidatePath("/dashboard/banners");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/banners failed:", error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}
