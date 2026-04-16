"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import PhoneCallbackIcon from "@mui/icons-material/PhoneCallback";
import LineIcon from "@/src/assets/icons/line-icon.svg";
import FacebookIconSvg from "@/src/assets/icons/facebook-icon.svg";
import { lineSupport } from "@/src/context/line-path";

interface ContactMethodItem {
  id: string;
  key: string;
  title: string;
  desc: string;
  href: string;
  iconUrl?: string | null;
  colorClass?: string | null;
}

interface ContactSectionProps {
  content?: {
    title?: string;
    subtitle?: string;
    isActive?: boolean;
  };
  methods?: ContactMethodItem[];
}

const fallbackMethods: ContactMethodItem[] = [
  {
    id: "line",
    key: "line",
    title: "สมัครทางไลน์",
    desc: "สะดวกรวดเร็วแอดมินตอบทันที",
    href: lineSupport,
  },
  {
    id: "phone",
    key: "phone",
    title: "โทรสมัคร",
    desc: "ติดต่อเจ้าหน้าที่ได้ทันที",
    href: "tel:021234567",
  },
  {
    id: "facebook",
    key: "facebook",
    title: "ติดต่อทาง Facebook",
    desc: "สะดวกรวดเร็ว ข้อมูลครบ",
    href: "https://www.facebook.com/profile.php?id=61558200500505",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

function ContactIcon({ method }: { method: ContactMethodItem }) {
  const key = (method.key || method.title || "").toLowerCase();
  const customBg = method.colorClass && method.colorClass.startsWith("#") ? method.colorClass : null;

  if (method.iconUrl) {
    return (
      <div
        className="rounded-[14px] w-14 h-14 flex items-center justify-center p-1 shadow-sm bg-slate-200"
        style={customBg ? { backgroundColor: customBg } : undefined}
      >
        <img src={method.iconUrl} alt={method.title} className="w-8 h-8 object-contain" />
      </div>
    );
  }

  if (key.includes("line")) {
    return (
      <div
        className="rounded-[14px] w-14 h-14 flex items-center justify-center p-1 shadow-sm"
        style={{ backgroundColor: customBg || "#00B900" }}
      >
        <Image src={LineIcon} alt="Line" width={32} height={32} className="object-contain" />
      </div>
    );
  }

  if (key.includes("facebook")) {
    return (
      <div
        className="rounded-[14px] w-14 h-14 flex items-center justify-center shadow-sm"
        style={{ backgroundColor: customBg || "#1877F2" }}
      >
        <Image src={FacebookIconSvg} alt="Facebook" width={36} height={36} className="object-contain" />
      </div>
    );
  }

  return (
    <div
      className="rounded-[14px] w-14 h-14 flex items-center justify-center shadow-sm"
      style={{ background: customBg || "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)" }}
    >
      <PhoneCallbackIcon className="text-white !text-3xl" />
    </div>
  );
}

export default function ContactSection({ content, methods }: ContactSectionProps) {
  const sectionTitle = content?.title || "ติดต่อและสมัครบริการ";
  const sectionSubtitle = content?.subtitle || "เลือกช่องทางที่สะดวก ทีมงานพร้อมดูแลทันที";
  const sectionVisible = content?.isActive ?? true;

  if (!sectionVisible) {
    return null;
  }

  const displayMethods = methods && methods.length > 0 ? methods : fallbackMethods;

  return (
    <section className="py-20 bg-slate-50 font-prompt w-full overflow-hidden relative">
      {/* Background Graphic Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-96 h-96 rounded-full bg-blue-100 opacity-40 blur-3xl mix-blend-multiply"></div>
        <div className="absolute -bottom-[10%] -left-[5%] w-96 h-96 rounded-full bg-slate-200 opacity-50 blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-[28px] font-bold text-[#0f172a] mb-2 tracking-tight"
        >
          {sectionTitle}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 mb-10 text-sm md:text-base font-medium"
        >
          {sectionSubtitle}
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-col md:flex-row justify-center items-stretch gap-4 md:gap-5"
        >
          {displayMethods.map((method) => (
            <motion.a
              key={method.id}
              href={
                method.href?.trim() && method.href.trim() !== "/service" && method.href.trim() !== "#"
                  ? method.href.trim()
                  : lineSupport
              }
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center p-5 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgb(0,0,0,0.08)] border border-slate-100 transition-all duration-300 md:w-[320px] text-left group"
            >
              <div className="mr-5 shrink-0 group-hover:scale-105 transition-transform duration-300">
                <ContactIcon method={method} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {method.title}
                </h4>
                <p className="text-sm text-slate-500 leading-snug mt-0.5">
                  {method.desc}
                </p>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
