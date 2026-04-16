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
      code?: string;
      name?: string;
      imageUrl?: string | null;
      freebie?: any;
      speed?: string;
      price?: number;
      details?: any;
      type?: string | null;
      buyUrl?: string | null;
      status?: boolean;
      displayOrder?: number;
    } = {};

    if ("code" in body) {
      const code = nullableString(body.code);
      if (!code) {
        return NextResponse.json({ error: "code cannot be empty" }, { status: 400 });
      }
      data.code = code;
    }

    if ("name" in body) {
      const name = nullableString(body.name);
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      data.name = name;
    }

    if ("imageUrl" in body) {
      const imageUrl = safeAssetUrl(body.imageUrl);
      if (body.imageUrl && !imageUrl) {
        return NextResponse.json({ error: "imageUrl format is invalid" }, { status: 400 });
      }
      data.imageUrl = imageUrl;
    }

    if ("freebie" in body) {
      data.freebie = (body.freebie ?? null) as any;
    }

    if ("speed" in body) {
      const speed = nullableString(body.speed);
      if (!speed) {
        return NextResponse.json({ error: "speed cannot be empty" }, { status: 400 });
      }
      data.speed = speed;
    }

    if ("price" in body) {
      data.price = safeNumber(body.price, 0);
    }

    if ("details" in body) {
      data.details = (body.details ?? null) as any;
    }

    if ("type" in body) {
      data.type = nullableString(body.type);
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

    const updated = await prisma.package.update({
      where: { id },
      data,
    });

    revalidatePath("/home");
    revalidatePath("/boardband");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/packages/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    await prisma.package.delete({ where: { id } });

    revalidatePath("/home");
    revalidatePath("/boardband");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/packages/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
