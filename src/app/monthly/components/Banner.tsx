"use client";

import { motion } from "framer-motion";

export default function BannerMonthy() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 pt-28 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-6 py-10 text-white shadow-[0_28px_56px_rgba(15,23,42,0.22)] md:px-10 md:py-14"
        >
          <div className="absolute -left-10 -top-14 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 right-8 h-64 w-64 rounded-full bg-emerald-200/10 blur-3xl" />

          <p className="relative text-xs uppercase tracking-[0.22em] text-slate-300">monthly mobile plans</p>
          <h1 className="relative mt-3 text-3xl font-black leading-tight md:text-5xl">
            แพ็กเกจมือถือ
            <br className="hidden md:block" />
            แบบรายเดือน
          </h1>
          <p className="relative mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
            เปิดเบอร์ใหม่ ย้ายค่าย หรือแพ็กเสริม ครบในหน้าเดียว
            เลือกแพ็กที่ตรงการใช้งานและสมัครผ่านเจ้าหน้าที่ได้ทันที
          </p>
        </motion.div>
      </div>
    </section>
  );
}
