"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard/overview",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v18h16.5M7.5 15.75l3-3 2.25 2.25 4.5-6"
        />
      </svg>
    ),
  },
  {
    label: "Home Content",
    href: "/dashboard/home-content",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
  },
  {
    label: "Promotions",
    href: "/dashboard/promotions",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 14.25l6-6m-5.25 0h4.5a.75.75 0 01.75.75v4.5M3.75 6.75h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z"
        />
      </svg>
    ),
  },
  {
    label: "Monthly Packages",
    href: "/dashboard/monthly",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 6.75h7.5m-10.5 4.5h13.5M5.25 15.75h13.5M3.75 4.5h16.5A1.5 1.5 0 0121.75 6v12a1.5 1.5 0 01-1.5 1.5H3.75A1.5 1.5 0 012.25 18V6a1.5 1.5 0 011.5-1.5z"
        />
      </svg>
    ),
  },
  {
    label: "Topup Packages",
    href: "/dashboard/topup",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M6.75 3.75v6m10.5-6v6M4.5 9.75h15a1.5 1.5 0 011.5 1.5v6.75a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V11.25a1.5 1.5 0 011.5-1.5z"
        />
      </svg>
    ),
  },
  {
    label: "Solar Packages",
    href: "/dashboard/solar",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386l-1.59 1.59M21 12h-2.25m-.386 6.364l-1.59-1.59M12 18.75V21m-6.364-.386l1.59-1.59M3 12h2.25m.386-6.364l1.59 1.59M12 15a3 3 0 100-6 3 3 0 000 6z"
        />
      </svg>
    ),
  },
  {
    label: "Solar Content",
    href: "/dashboard/solar-content",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 6.75h15m-15 5.25h15m-15 5.25h9m-1.5-13.5h6.75A1.5 1.5 0 0120.25 5.25v13.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5h6.75z"
        />
      </svg>
    ),
  },
  {
    label: "Service Content",
    href: "/dashboard/service-content",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 6.75h10.5m-10.5 4.5h10.5m-10.5 4.5h10.5M3.75 6.75h.008v.008H3.75V6.75zm0 4.5h.008v.008H3.75v-.008zm0 4.5h.008v.008H3.75v-.008z"
        />
      </svg>
    ),
  },
];

interface DashboardSidebarProps {
  userEmail: string;
}

export default function DashboardSidebar({ userEmail }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Brand */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">Telemart</h2>
            <p className="text-gray-500 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Sign Out */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-gray-300 text-xs font-semibold">
              {userEmail.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-300 text-xs truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
