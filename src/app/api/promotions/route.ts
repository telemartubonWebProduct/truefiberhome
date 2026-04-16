import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  safeAssetUrl,
  safeLink,
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
    const promotions = await prisma.promotion.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(promotions);
  } catch (error) {
    console.error("GET /api/promotions failed:", error);
    return NextResponse.json({ error: "Failed to load promotions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const type = nullableString(body.type);
    const name = nullableString(body.name);
    const imageUrl = safeAssetUrl(body.imageUrl);
    const buyUrl = safeLink(body.buyUrl);

    if (!type || !name) {
      return NextResponse.json({ error: "type and name are required" }, { status: 400 });
    }

    if ("imageUrl" in body && body.imageUrl && !imageUrl) {
      return NextResponse.json({ error: "imageUrl format is invalid" }, { status: 400 });
    }

    if ("buyUrl" in body && body.buyUrl && !buyUrl) {
      return NextResponse.json({ error: "buyUrl format is invalid" }, { status: 400 });
    }

    const created = await prisma.promotion.create({
      data: {
        type,
        categoryName: nullableString(body.categoryName),
        name,
        price: safeNumber(body.price, 0),
        priceNote: nullableString(body.priceNote),
        speed: nullableString(body.speed),
        validity: nullableString(body.validity),
        imageUrl,
        promoBadge: nullableString(body.promoBadge),
        perks: body.perks ?? null,
        details: body.details ?? null,
        buyUrl,
        status: safeBoolean(body.status, true),
        displayOrder: safeNumber(body.displayOrder, 0),
      },
    });

    revalidatePath("/home");
    revalidatePath("/boardband");
    revalidatePath("/monthly");
    revalidatePath("/topup");
    revalidatePath("/wEnergy");
    revalidatePath("/dashboard/promotions");
    revalidatePath("/dashboard/monthly");
    revalidatePath("/dashboard/topup");
    revalidatePath("/dashboard/solar");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/promotions failed:", error);
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}
