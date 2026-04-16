"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import RouterIcon from "@mui/icons-material/Router";
import TimerIcon from "@mui/icons-material/Timer";
import MapIcon from "@mui/icons-material/Map";
import ChecklistIcon from "@mui/icons-material/Checklist";
import EngineeringIcon from "@mui/icons-material/Engineering";
import type { ReactNode } from "react";
import {
  agentsData as defaultAgents,
  whyChooseItems as defaultWhyChoose,
  processSteps as defaultSteps,
} from "@/src/data/agents";

// Map icon names to MUI components
const iconMap: Record<string, (className: string) => ReactNode> = {
  Timer: (cls) => <TimerIcon className={cls} />,
  SupportAgent: (cls) => <SupportAgentIcon className={cls} />,
  Router: (cls) => <RouterIcon className={cls} />,
  Map: (cls) => <MapIcon className={cls} />,
  Checklist: (cls) => <ChecklistIcon className={cls} />,
  Engineering: (cls) => <EngineeringIcon className={cls} />,
};

function getIcon(name: string, className: string): ReactNode {
  return (
    iconMap[name]?.(className) ?? <SupportAgentIcon className={className} />
  );
}

interface AgentFromDB {
  id: string | number;
  name: string;
  phoneNumber: string;
  role: string;
  closedDeal: number;
  photoUrl?: string | null;
}

interface SalerServiceProps {
  agents?: AgentFromDB[];
  whyChooseData?: { iconName: string; title: string; desc: string }[];
  processStepsData?: {
    num: number;
    iconName: string;
    title: string;
    desc: string;
  }[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", bounce: 0.4, duration: 0.8 },
  },
};

export default function SalerService({
  agents,
  whyChooseData,
  processStepsData,
}: SalerServiceProps) {
  // Use DB data with static fallbacks
  const hasDbAgents = Array.isArray(agents);
  const agentsList = hasDbAgents
    ? agents.map((a) => ({
        id: a.id,
        name: a.name,
        phoneNumber: a.phoneNumber,
        role: a.role,
        closedDeal: a.closedDeal,
        photo: a.photoUrl ?? "",
      }))
    : defaultAgents;

  const whyChooseItems =
    whyChooseData && Array.isArray(whyChooseData) && whyChooseData.length > 0
      ? whyChooseData
      : defaultWhyChoose;

  const processStepsList =
    processStepsData &&
    Array.isArray(processStepsData) &&
    processStepsData.length > 0
      ? processStepsData
      : defaultSteps;

  return (
    <section className="flex flex-col w-full bg-white pb-16 font-prompt">
      {/* ── Hero Header ── */}
      <div className="relative bg-[#111] pt-20 pb-44 text-white text-center shadow-inner overflow-hidden flex flex-col items-center justify-center">
        {/* Animated Background Gradients */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(circle at 50% 120%, rgba(255,0,0,0.3) 0%, transparent 60%)",
          }}
        />

        <motion.p
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative text-sm md:text-base font-medium text-[#ff3b30] mb-3"
        >
          พบกับทีมผู้เชี่ยวชาญของเรา
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, type: "spring" }}
          className="relative text-4xl md:text-5xl font-bold tracking-tight"
        >
          ทีมงานมืออาชีพ{" "}
          <span className="text-[#ff3b30] drop-shadow-[0_0_15px_rgba(255,59,48,0.5)]">
            พร้อมให้บริการ
          </span>
        </motion.h2>
      </div>

      {/* ── Agent Cards ── */}
      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10 w-full mb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-wrap justify-center gap-8 md:gap-10"
        >
          {agentsList.map((agent, i) => (
            <motion.div
              key={agent.id}
              variants={itemVariants}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="relative flex flex-col items-center bg-white rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_50px_rgba(255,0,0,0.12)] transition-shadow duration-300 group w-full max-w-[320px]"
            >
              {/* Image Container */}
              <div className="w-full h-[280px] bg-[#f8f9fa] relative flex items-end justify-center overflow-hidden">
                {agent.photo ? (
                  <Image
                    src={agent.photo}
                    alt={agent.name}
                    width={300}
                    height={400}
                    className="object-cover h-full w-auto transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-[#eceff3] text-gray-400">
                    <SupportAgentIcon className="!text-6xl" />
                  </div>
                )}
              </div>

              {/* Content Container */}
              <div className="w-full bg-white p-6 text-center z-20 flex flex-col items-center">
                <h4 className="font-bold text-[#111] text-xl mb-1">
                  {agent.name}
                </h4>
                <p className="font-bold text-[#ff3b30] text-sm mb-4">
                  {agent.phoneNumber}
                </p>

                {/* Divider */}
                <div className="w-8 h-[2px] bg-[#ff3b30] rounded-full mb-4 opacity-80" />

                <p className="text-xs font-medium text-gray-500">
                  {agent.role}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Why Choose Section ── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="max-w-6xl mx-auto px-4 mt-8 text-center w-full"
      >
        <motion.p
          variants={itemVariants}
          className="text-sm md:text-base font-medium text-[#ff3b30] mb-2"
        >
          ทำไมถึงต้องเลือกใช้บริการเรา
        </motion.p>
        <motion.h3
          variants={itemVariants}
          className="text-2xl md:text-4xl font-bold text-[#111] mb-16 tracking-tight"
        >
          เหนือกว่าด้วยคุณภาพและบริการ
        </motion.h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {whyChooseItems.map(
            (
              item: { iconName: string; title: string; desc: string },
              i: number,
            ) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="text-[#111] mb-6 p-6 rounded-2xl bg-[#f8f9fa] transition-all duration-300 group-hover:bg-[#fff0f0] group-hover:text-[#ff3b30] group-hover:shadow-[0_10px_20px_rgba(255,59,48,0.1)]">
                  {getIcon(
                    item.iconName,
                    "!text-5xl transition-transform duration-300 group-hover:scale-110",
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#111] mb-3 transition-colors duration-300 group-hover:text-[#ff3b30]">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-[250px]">
                  {item.desc}
                </p>
              </motion.div>
            ),
          )}
        </div>
      </motion.div>

      {/* ── Process Steps ── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="max-w-5xl mx-auto px-4 mt-32 text-center w-full pb-10"
      >
        <motion.p
          variants={itemVariants}
          className="text-sm md:text-base font-medium text-[#ff3b30] mb-2"
        >
          ขั้นตอนการให้บริการ
        </motion.p>
        <motion.h3
          variants={itemVariants}
          className="text-2xl md:text-4xl font-bold text-[#111] mb-20 tracking-tight"
        >
          สะดวก ทันใจ ใน 3 ขั้นตอน
        </motion.h3>

        <div className="relative flex flex-col md:flex-row justify-between items-start">
          <div className="hidden md:block absolute top-[2.5rem] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent -z-10"></div>

          {processStepsList.map(
            (
              step: {
                num: number;
                iconName: string;
                title: string;
                desc: string;
              },
              i: number,
            ) => (
              <motion.div
                key={step.num}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className={`flex flex-col items-center w-full md:w-1/3 ${i < 2 ? "mb-12 md:mb-0" : ""} relative bg-white group cursor-pointer`}
              >
                <div className="w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-400 flex items-center justify-center font-bold text-lg absolute top-0 left-[50%] md:left-[25%] -translate-x-1/2 -translate-y-1/2 md:translate-y-0 md:-ml-10 z-10 shadow-sm group-hover:border-[#ff3b30] group-hover:text-[#ff3b30] group-hover:bg-[#fff0f0] transition-all duration-300 group-hover:scale-110">
                  {step.num}
                </div>
                <div className="text-[#111] mb-5 p-5 bg-[#f8f9fa] rounded-2xl inline-block mt-5 md:mt-2 group-hover:shadow-[0_10px_20px_rgba(255,59,48,0.1)] group-hover:bg-[#fff0f0] group-hover:text-[#ff3b30] transition-all duration-300">
                  {getIcon(
                    step.iconName,
                    "!text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
                  )}
                </div>
                <h3 className="text-base font-bold text-[#111] mb-2 transition-colors duration-300 group-hover:text-[#ff3b30]">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </motion.div>
            ),
          )}
        </div>
      </motion.div>
    </section>
  );
}
