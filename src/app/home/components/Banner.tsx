"use client";
import { motion } from "framer-motion";

interface PromoBannerData {
  imageUrl?: string | null;
  title?: string | null;
}

interface BannerProps {
  promoBannerData?: PromoBannerData | null;
}

export default function Banner({ promoBannerData }: BannerProps) {
  const imageUrl = promoBannerData?.imageUrl || "/assets/etc/BannerTrue.webp";
  const altText = promoBannerData?.title || "โปรโมชันพิเศษ True Telemart – สมัครเน็ตบ้าน มือถือ และบริการดิจิทัลครบวงจร";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10"
    >
      <motion.img
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        src={imageUrl}
        alt={altText}
        width={1400}
        height={400}
        loading="lazy"
        decoding="async"
        className="w-full rounded-lg shadow-lg object-cover"
      />
    </motion.div>
  );
}