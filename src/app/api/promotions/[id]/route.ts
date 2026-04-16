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
      type?: string;
      categoryName?: string | null;
      name?: string;
      price?: number;
      priceNote?: string | null;
      speed?: string | null;
      validity?: string | null;
      imageUrl?: string | null;
      promoBadge?: string | null;
      perks?: any;
      details?: any;
      buyUrl?: string | null;
      status?: boolean;
      displayOrder?: number;
    } = {};

    if ("type" in body) {
      const type = nullableString(body.type);
      if (!type) {
        return NextResponse.json({ error: "type cannot be empty" }, { status: 400 });
      }
      data.type = type;
    }

    if ("categoryName" in body) {
      data.categoryName = nullableString(body.categoryName);
    }

    if ("name" in body) {
      const name = nullableString(body.name);
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      data.name = name;
    }

    if ("price" in body) {
      data.price = safeNumber(body.price, 0);
    }

    if ("priceNote" in body) {
      data.priceNote = nullableString(body.priceNote);
    }

    if ("speed" in body) {
      data.speed = nullableString(body.speed);
    }

    if ("validity" in body) {
      data.validity = nullableString(body.validity);
    }

    if ("imageUrl" in body) {
      const imageUrl = safeAssetUrl(body.imageUrl);
      if (body.imageUrl && !imageUrl) {
        return NextResponse.json({ error: "imageUrl format is invalid" }, { status: 400 });
      }
      data.imageUrl = imageUrl;
    }

    if ("promoBadge" in body) {
      data.promoBadge = nullableString(body.promoBadge);
    }

    if ("perks" in body) {
      data.perks = (body.perks ?? null) as any;
    }

    if ("details" in body) {
      data.details = (body.details ?? null) as any;
    }

    if ("buyUrl" in body) {
      const buyUrl = safeLink(body.buyUrl);
      if (body.buyUrl && !buyUrl) {
        return NextResponse.json({ error: "buyUrl format is invalid" }, { status: 400 });
      }
      data.buyUrl = buyUrl;
    }

    if ("status" in body) {
      data.status = safeBoolean(body.status, true);
    }

    if ("displayOrder" in body) {
      data.displayOrder = safeNumber(body.displayOrder, 0);
    }

    const updated = await prisma.promotion.update({
      where: { id },
      data,
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/promotions/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    await prisma.promotion.delete({ where: { id } });

    revalidatePath("/home");
    revalidatePath("/boardband");
    revalidatePath("/monthly");
    revalidatePath("/topup");
    revalidatePath("/wEnergy");
    revalidatePath("/dashboard/promotions");
    revalidatePath("/dashboard/monthly");
    revalidatePath("/dashboard/topup");
    revalidatePath("/dashboard/solar");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/promotions/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
}
