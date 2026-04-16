import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { nullableString, safeBoolean } from "@/src/lib/api-normalize";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

type Context = { params: Promise<{ sectionKey: string }> };

export async function GET(_: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { sectionKey } = await context.params;
    const section = await prisma.homeSection.findUnique({ where: { sectionKey } });
    return NextResponse.json(section);
  } catch (error) {
    console.error("GET /api/home-sections/[sectionKey] failed:", error);
    return NextResponse.json({ error: "Failed to load section" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { sectionKey } = await context.params;
    const body = await request.json();

    const section = await prisma.homeSection.upsert({
      where: { sectionKey },
      update: {
        title: "title" in body ? nullableString(body.title) : undefined,
        subtitle: "subtitle" in body ? nullableString(body.subtitle) : undefined,
        imageUrl: "imageUrl" in body ? nullableString(body.imageUrl) : undefined,
        linkUrl: "linkUrl" in body ? nullableString(body.linkUrl) : undefined,
        jsonData: "jsonData" in body ? body.jsonData ?? null : undefined,
        isActive: "isActive" in body ? safeBoolean(body.isActive, true) : undefined,
      },
      create: {
        sectionKey,
        title: nullableString(body.title),
        subtitle: nullableString(body.subtitle),
        imageUrl: nullableString(body.imageUrl),
        linkUrl: nullableString(body.linkUrl),
        jsonData: body.jsonData ?? null,
        isActive: safeBoolean(body.isActive, true),
      },
    });

    revalidatePath("/home");
    revalidatePath("/service");
    revalidatePath("/wEnergy");
    revalidatePath("/dashboard/home-content");
    revalidatePath("/dashboard/service-content");
    revalidatePath("/dashboard/solar-content");

    return NextResponse.json(section);
  } catch (error) {
    console.error("PUT /api/home-sections/[sectionKey] failed:", error);
    return NextResponse.json({ error: "Failed to save section" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { sectionKey } = await context.params;

    await prisma.homeSection.deleteMany({ where: { sectionKey } });

    revalidatePath("/home");
    revalidatePath("/service");
    revalidatePath("/wEnergy");
    revalidatePath("/dashboard/home-content");
    revalidatePath("/dashboard/service-content");
    revalidatePath("/dashboard/solar-content");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/home-sections/[sectionKey] failed:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
