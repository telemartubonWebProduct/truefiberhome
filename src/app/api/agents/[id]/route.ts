import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  nullableString,
  safeBoolean,
  safeNumber,
  toIntId,
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
    const agentId = toIntId(id);
    if (!agentId) {
      return NextResponse.json({ error: "Invalid agent id" }, { status: 400 });
    }

    const body = await request.json();

    const data: {
      name?: string;
      phoneNumber?: string;
      role?: string;
      closedDeal?: number;
      photoUrl?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    } = {};

    if ("name" in body) {
      const name = nullableString(body.name);
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      data.name = name;
    }

    if ("phoneNumber" in body) {
      const phoneNumber = nullableString(body.phoneNumber);
      if (!phoneNumber) {
        return NextResponse.json(
          { error: "phoneNumber cannot be empty" },
          { status: 400 }
        );
      }
      data.phoneNumber = phoneNumber;
    }

    if ("role" in body) {
      const role = nullableString(body.role);
      if (!role) {
        return NextResponse.json({ error: "role cannot be empty" }, { status: 400 });
      }
      data.role = role;
    }

    if ("closedDeal" in body) {
      data.closedDeal = safeNumber(body.closedDeal, 0);
    }

    if ("photoUrl" in body) {
      data.photoUrl = nullableString(body.photoUrl);
    }

    if ("displayOrder" in body) {
      data.displayOrder = safeNumber(body.displayOrder, 0);
    }

    if ("isActive" in body) {
      data.isActive = safeBoolean(body.isActive, true);
    }

    const updated = await prisma.agent.update({
      where: { id: agentId },
      data,
    });

    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/agents/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const agentId = toIntId(id);
    if (!agentId) {
      return NextResponse.json({ error: "Invalid agent id" }, { status: 400 });
    }

    await prisma.agent.delete({ where: { id: agentId } });

    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/agents/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 });
  }
}
