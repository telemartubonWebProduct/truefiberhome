import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { nullableString, safeBoolean, safeLink, safeNumber } from "@/src/lib/api-normalize";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const items = await prisma.footerLink.findMany({
      orderBy: [{ section: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/footer-links failed:", error);
    return NextResponse.json({ error: "Failed to load footer links" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const section = nullableString(body.section);
    const label = nullableString(body.label);
    const path = safeLink(body.path);

    if (!section || !label || !path) {
      return NextResponse.json(
        { error: "section, label, and path are required" },
        { status: 400 }
      );
    }

    const created = await prisma.footerLink.create({
      data: {
        section,
        label,
        path,
        external: safeBoolean(body.external, false),
        displayOrder: safeNumber(body.displayOrder, 0),
        isActive: safeBoolean(body.isActive, true),
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/footer-links failed:", error);
    return NextResponse.json({ error: "Failed to create footer link" }, { status: 500 });
  }
}
