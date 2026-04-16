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
    const agentDelegate = (prisma as any).agent;
    if (!agentDelegate) {
      return NextResponse.json([]);
    }

    const agents = await agentDelegate.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("GET /api/agents failed:", error);
    return NextResponse.json({ error: "Failed to load agents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const name = nullableString(body.name);
    const phoneNumber = nullableString(body.phoneNumber);
    const role = nullableString(body.role);

    if (!name || !phoneNumber || !role) {
      return NextResponse.json(
        { error: "name, phoneNumber, and role are required" },
        { status: 400 }
      );
    }

    const agentDelegate = (prisma as any).agent;
    if (!agentDelegate) {
      return NextResponse.json(
        { error: "Agent model is unavailable. Please run Prisma generate and restart dev server." },
        { status: 500 }
      );
    }

    const created = await agentDelegate.create({
      data: {
        name,
        phoneNumber,
        role,
        closedDeal: safeNumber(body.closedDeal, 0),
        photoUrl: nullableString(body.photoUrl),
        displayOrder: safeNumber(body.displayOrder, 0),
        isActive: safeBoolean(body.isActive, true),
      },
    });

    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/agents failed:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
