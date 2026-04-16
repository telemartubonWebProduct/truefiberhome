"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

interface RevealTextProps {
  text: string;
  className?: string;
}

export default function RevealText({ text, className = "" }: RevealTextProps) {
  // แยกข้อความออกเป็นคำๆ เพื่อให้ค่อยๆ เลื่อนขึ้นมาทีละคำ (Stagger effect)
  const words = text.split(" ");

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // ดีเลย์ระหว่างคำ
      },
    },
  };

  const item: Variants = {
    hidden: { y: "100%" }, // เริ่มต้นซ่อนอยู่ข้างล่างกล่อง
    show: {
      y: "0%", // เลื่อนเข้าตำแหน่งปกติ
      transition: {
        ease: [0.77, 0, 0.17, 1] as [number, number, number, number], // Custom easing curve ให้สมูทแบบ Apple/Premium
        duration: 0.8,
      },
    },
  };

  return (
    <motion.h2
      variants={container}
      initial="hidden"
      whileInView="show" // ทำงานเมื่อเลื่อน (Scroll) ลงมาถึงข้อความนี้
      viewport={{ once: true, margin: "-50px" }} // เลื่อนให้ถึงจุดที่ต้องการก่อนค่อยเล่นเอฟเฟกต์
      className={`text-4xl md:text-5xl lg:text-6xl font-medium leading-tight text-black flex flex-wrap gap-x-3 gap-y-2 ${className}`}
    >
      {words.map((word, index) => (
        // กล่องครอบนอกทำหน้าที่เป็น "หน้ากาก" ตัดส่วนที่เกินออก
        <span key={index} className="overflow-hidden inline-block overflow-y-hidden pb-1">
          {/* ตัวอักษรข้างในจะเลื่อนขึ้น */}
          <motion.span variants={item} className="inline-block">
            {word}
          </motion.span>
        </span>
      ))}
    </motion.h2>
  );
}
