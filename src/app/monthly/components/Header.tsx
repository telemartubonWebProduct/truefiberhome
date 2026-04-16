"use client";

import { useEffect, useState } from "react";

interface HeaderMonthyProps {
  tabs: string[];
  onTabClick: (tab: string) => void;
}

export default function HeaderMonthy({ tabs, onTabClick }: HeaderMonthyProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0] || "ทั้งหมด");

  useEffect(() => {
    if (tabs.length > 0 && !tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  return (
    <div className="flex items-center justify-center bg-white px-4 mt-4">
      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 ${
              activeTab === tab ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => {
              setActiveTab(tab);
              onTabClick(tab);
            }}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
