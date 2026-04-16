"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import HomeIcon from "@mui/icons-material/Home";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import RouterIcon from "@mui/icons-material/Router";
import { lineSupport } from "@/src/context/line-path";

const navItems = [
  {
    name: "หน้าแรก",
    href: "/",
    icon: <HomeIcon className="text-white w-5 h-5" />,
    colorClass: "bg-[#10c172]", 
  },
  {
    name: "แพ็กเกจ",
    href: "/boardband", // เปลี่ยนเป็นลิงก์จริงได้เลย
    icon: <RocketLaunchIcon className="text-white w-5 h-5" />,
    colorClass: "bg-[#ff6b2b]",
  },
  {
    name: "สมัครทาง LINE",
    href: lineSupport,
    icon: (
      <svg className="text-white w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.513 8.878 8.358 9.605.327.067.77.202.89.479.108.252.07.545.034.739l-.19 1.155c-.046.284-.216 1.042.923.565 1.139-.476 6.136-3.606 8.363-6.183C22.68 14.619 24 12.593 24 10.304zM9.477 13.064h-1.63V7.781c0-.28-.225-.508-.505-.508s-.505.228-.505.508v5.791c0 .281.226.509.505.509h2.135c.28 0 .506-.228.506-.509s-.226-.508-.506-.508zm3.627 0h-1.011c-.28 0-.505-.228-.505-.508v-5.283c0-.28.225-.508.505-.508h1.011c.28 0 .506.228.506.508v5.283c0 .28-.226.508-.506.508zm5.719-3.237v2.729c0 .28-.225.508-.506.508h-1.62c-.28 0-.505-.228-.505-.508V7.781c0-.28.225-.508.505-.508h1.62c.28 0 .506.228.506.508v1.311c0 .28-.226.508-.506.508h-.609v.883h.609c.28 0 .506.228.506.508s-.226.509-.506.509h-.609v1.036h.609c.28 0 .506.228.506.509zm-8.868.508l-2.12-3.149c-.066-.098-.17-.16-.282-.17a.519.519 0 00-.339.091c-.131.096-.211.25-.211.413v2.815c0 .28.226.508.506.508.28 0 .505-.228.505-.508v-2.02l1.637 2.434c.105.155.275.249.458.249a.508.508 0 00.506-.508V7.781c0-.28-.226-.508-.506-.508s-.506.228-.506.508v2.546z"/>
      </svg>
    ),
    colorClass: "bg-[#00c300]",
  },
  {
    name: "พิเศษ",
    href: "/special", // เปลี่ยนเป็นลิงก์จริงได้เลย
    icon: <CardGiftcardIcon className="text-white w-5 h-5" />,
    colorClass: "bg-[#ff7a00]",
  },
  {
    name: "เราเตอร์ใส่ซิม",
    href: "/router", // เปลี่ยนเป็นลิงก์จริงได้เลย
    icon: <RouterIcon className="text-white w-5 h-5" />,
    colorClass: "bg-[#00b2ff]",
  }
];

export default function BottomNav() {
  const pathname = usePathname();
  
  // ซ่อน Bottom Bar หากอยู่ใน Dashboard / Backend
  const isHiddenRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/backend");
  if (isHiddenRoute) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden bg-white/80 backdrop-blur-md border-t border-gray-200 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-1 max-w-2xl mx-auto">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={idx} 
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-0.5 rounded-xl transition-all duration-200 ${
                isActive ? "bg-slate-100/80" : "hover:bg-gray-50"
              }`}
            >
              <div className={`w-[34px] h-[34px] rounded-2xl flex items-center justify-center mb-1 ${item.colorClass} shadow-sm`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-medium tracking-tight whitespace-nowrap ${
                isActive ? "text-slate-800" : "text-gray-500"
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