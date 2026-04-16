import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Login | Telemart Admin",
  description: "เข้าสู่ระบบผู้ดูแลเพื่อจัดการคอนเทนต์เว็บไซต์",
  alternates: { canonical: "/login" },
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

export default function LoginPage() {
  return <LoginClient />;
}
