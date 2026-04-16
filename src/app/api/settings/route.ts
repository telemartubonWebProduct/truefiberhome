import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { nullableString } from "@/src/lib/api-normalize";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { prisma } from "@/src/lib/prisma";

export async function PUT(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: {
        logoUrl: nullableString(body.logoUrl),
        footerImageUrl: nullableString(body.footerImageUrl),
        phone: nullableString(body.phone),
        email: nullableString(body.email),
        description: nullableString(body.description),
        lineSupportUrl: nullableString(body.lineSupportUrl),
        facebookUrl: nullableString(body.facebookUrl),
        referralSystem: nullableString(body.referralSystem),
      },
      create: {
        id: "singleton",
        logoUrl: nullableString(body.logoUrl),
        footerImageUrl: nullableString(body.footerImageUrl),
        phone: nullableString(body.phone),
        email: nullableString(body.email),
        description: nullableString(body.description),
        lineSupportUrl: nullableString(body.lineSupportUrl),
        facebookUrl: nullableString(body.facebookUrl),
        referralSystem: nullableString(body.referralSystem),
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/home");
    revalidatePath("/dashboard/home-content");

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PUT /api/settings failed:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
