import { NextResponse } from "next/server";
import type { AdminRole } from "@prisma/client";
import { createServerSupabaseClient } from "@/src/lib/supabase-server";
import { prisma } from "@/src/lib/prisma";

type AuthenticatedUser = {
  id: string;
  email?: string | null;
  user_metadata?: {
    name?: unknown;
  } | null;
};

function parseCsvEnv(value: string | undefined) {
  if (!value) {
    return [] as string[];
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

function canBootstrapFirstAdmin(user: AuthenticatedUser) {
  const allowedUids = parseCsvEnv(process.env.ADMIN_BOOTSTRAP_UIDS);
  const allowedEmails = parseCsvEnv(process.env.ADMIN_BOOTSTRAP_EMAILS);
  const normalizedEmail = user.email?.trim().toLowerCase() || "";

  return allowedUids.includes(user.id.toLowerCase()) || (!!normalizedEmail && allowedEmails.includes(normalizedEmail));
}

function deriveAdminName(user: AuthenticatedUser) {
  const metadataName =
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";

  if (metadataName.length > 0) {
    return metadataName;
  }

  if (user.email && user.email.includes("@")) {
    return user.email.split("@")[0] || "Administrator";
  }

  return "Administrator";
}

function deriveAdminEmail(user: AuthenticatedUser) {
  return user.email || `${user.id}@local.invalid`;
}

async function resolveAdminProfile(user: AuthenticatedUser) {
  const activeAdmin = await prisma.adminProfile.findFirst({
    where: {
      authUid: user.id,
      isActive: true,
    },
  });

  if (activeAdmin) {
    return activeAdmin;
  }

  const activeAdminCount = await prisma.adminProfile.count({
    where: {
      isActive: true,
    },
  });

  // Bootstrap the first admin only when the current user is explicitly allowlisted.
  if (activeAdminCount === 0 && canBootstrapFirstAdmin(user)) {
    return prisma.adminProfile.upsert({
      where: {
        authUid: user.id,
      },
      create: {
        authUid: user.id,
        name: deriveAdminName(user),
        email: deriveAdminEmail(user),
        role: "SUPER_ADMIN",
        isActive: true,
      },
      update: {
        name: deriveAdminName(user),
        email: deriveAdminEmail(user),
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });
  }

  return null;
}

export async function requireDashboardUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      admin: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  let admin;

  try {
    admin = await resolveAdminProfile(user);
  } catch (queryError) {
    console.error("Failed to verify dashboard admin profile", queryError);

    return {
      user,
      admin: null,
      response: NextResponse.json(
        { error: "Admin profile table is unavailable. Run migrations and Prisma generate." },
        { status: 503 }
      ),
    };
  }

  if (!admin) {
    return {
      user,
      admin: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, admin, response: null as NextResponse | null };
}

export async function getOptionalAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      admin: null,
    };
  }

  try {
    const admin = await resolveAdminProfile(user);

    return {
      user,
      admin,
    };
  } catch (error) {
    console.error("Failed to query admin profile", error);

    return {
      user,
      admin: null,
    };
  }
}

export async function requireAdmin(requiredRole?: AdminRole) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      admin: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  let admin;

  try {
    admin = await resolveAdminProfile(user);
  } catch (error) {
    console.error("Failed to verify admin profile", error);

    return {
      user,
      admin: null,
      response: NextResponse.json(
        { error: "Admin profile table is unavailable. Run migrations and Prisma generate." },
        { status: 503 }
      ),
    };
  }

  if (!admin) {
    return {
      user,
      admin: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (requiredRole && admin.role !== requiredRole && admin.role !== "SUPER_ADMIN") {
    return {
      user,
      admin,
      response: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  return {
    user,
    admin,
    response: null as NextResponse | null,
  };
}
