import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/src/lib/supabase-server";
import DashboardSidebar from "./components/DashboardSidebar";



export const metadata: Metadata = {
  title: "Dashboard | Telemart Admin",
  description: "Telemart content management dashboard",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

/**
 * Dashboard layout with sidebar navigation.
 * Server component that verifies auth before rendering.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <DashboardSidebar userEmail={user.email || ""} />

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
