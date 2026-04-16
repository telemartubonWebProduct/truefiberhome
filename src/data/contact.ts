import type { ContactInfo } from "@/src/types/content";
import { lineSupport } from "@/src/context/line-path";

export const contactInfo: ContactInfo = {
  phone: "66+ 910192552",
  email: "Truetelemart@hotmail.com",
  socialLinks: [
    { label: "Line", href: lineSupport, colorClass: "hover:bg-green-400" },
    { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61571963492436", colorClass: "hover:bg-blue-400" },
  ],
};
