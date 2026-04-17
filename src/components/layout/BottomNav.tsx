"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import SimCardRoundedIcon from "@mui/icons-material/SimCardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { lineSupport } from "@/src/context/line-path";

const navItems = [
  {
    name: "หน้าแรก",
    href: "/",
    icon: <HomeRoundedIcon className="w-5 h-5" />,
  },
  {
    name: "แพ็กเกจ",
    href: "/boardband",
    icon: <RocketLaunchRoundedIcon className="w-5 h-5" />,
  },
  {
    name: "สมัครทาง LINE",
    href: lineSupport,
    icon: <ChatBubbleRoundedIcon className="w-5 h-5" />,
  },
  {
    name: "เซลลูลาร์",
    href: "/topup",
    icon: <SimCardRoundedIcon className="w-5 h-5" />,
  },
  {
    name: "โซล่าเซลล์",
    href: "/wEnergy",
    icon: <BoltRoundedIcon className="w-5 h-5" />,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  // ซ่อน Bottom Bar หากอยู่ใน Dashboard / Backend
  const isHiddenRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/backend");
  if (isHiddenRoute) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-black/10 bg-white/95 px-2 pt-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-1 rounded-2xl border border-black/5 bg-white/90 px-1 py-1">
        {navItems.map((item, idx) => {
          const isInternalRoute = item.href.startsWith("/");
          const isActive =
            isInternalRoute &&
            (item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href));

          return (
            <Link
              key={idx}
              href={item.href}
              target={isInternalRoute ? undefined : "_blank"}
              rel={isInternalRoute ? undefined : "noopener noreferrer"}
              className={`group relative flex flex-1 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 transition-all duration-200 ${
                isActive ? "bg-black/[0.04]" : "hover:bg-black/[0.03]"
              }`}
            >
              <div
                className={`mb-1 flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 ${
                  isActive
                    ? "border-[#d70018] bg-[#d70018] text-white shadow-[0_8px_18px_rgba(215,0,24,0.28)]"
                    : "border-black/10 bg-white text-black/85 group-hover:border-[#d70018]/40 group-hover:text-[#d70018]"
                }`}
              >
                {item.icon}
              </div>
              <span className={`whitespace-nowrap text-[9px] font-semibold tracking-tight transition-colors duration-200 ${
                isActive ? "text-[#d70018]" : "text-black/55 group-hover:text-black/80"
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}