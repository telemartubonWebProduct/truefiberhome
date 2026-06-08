import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalAdmin } from "@/src/lib/dashboard-auth";
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
  const { user, admin } = await getOptionalAdmin();

  if (!user) {
    redirect("/login");
  }

  if (!admin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar / Mobile Header */}
      <DashboardSidebar userEmail={user.email || ""} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
