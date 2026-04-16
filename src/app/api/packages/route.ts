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
    const packages = await prisma.package.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("GET /api/packages failed:", error);
    return NextResponse.json({ error: "Failed to load packages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const code = nullableString(body.code);
    const name = nullableString(body.name);
    const speed = nullableString(body.speed);
    const imageUrl = safeAssetUrl(body.imageUrl);
    const buyUrl = safeLink(body.buyUrl);

    if (!code || !name || !speed) {
      return NextResponse.json(
        { error: "code, name, and speed are required" },
        { status: 400 }
      );
    }

    if ("imageUrl" in body && body.imageUrl && !imageUrl) {
      return NextResponse.json({ error: "imageUrl format is invalid" }, { status: 400 });
    }

    if ("buyUrl" in body && body.buyUrl && !buyUrl) {
      return NextResponse.json({ error: "buyUrl format is invalid" }, { status: 400 });
    }

    const created = await prisma.package.create({
      data: {
        code,
        name,
        speed,
        price: safeNumber(body.price, 0),
        imageUrl,
        freebie: body.freebie ?? null,
        details: body.details ?? null,
        type: nullableString(body.type),
        buyUrl,
        status: safeBoolean(body.status, true),
        displayOrder: safeNumber(body.displayOrder, 0),
      },
    });

    revalidatePath("/home");
    revalidatePath("/boardband");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/packages failed:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
