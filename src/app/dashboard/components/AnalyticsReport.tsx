"use client";

import React from "react";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleIcon from "@mui/icons-material/People";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Link from "next/link";
import Image from "next/image";

export default function AnalyticsReport() {
  const topStats = [
    {
      title: "ยอดเข้าชมวันนี้",
      value: "500",
      percent: "+55%",
      isPositive: true,
      icon: <TrendingUpIcon className="text-white" />,
      color: "bg-emerald-500",
    },
    {
      title: "ระยะเวลาเฉลี่ยเข้าชม",
      value: "10 นาที",
      percent: "+55%",
      isPositive: true,
      icon: <ScheduleIcon className="text-white" />,
      color: "bg-teal-500",
    },
    {
      title: "ยอดติดต่อวันนี้",
      value: "10 คน",
      percent: "-14%",
      isPositive: false,
      icon: <PeopleIcon className="text-white" />,
      color: "bg-blue-500",
    },
    {
      title: "รวมยอดเข้าชมเว็บไซต์",
      value: "124,350",
      percent: "+55%",
      isPositive: true,
      icon: <VisibilityIcon className="text-white" />,
      color: "bg-cyan-500",
    },
  ];

  const topContent = [
    { name: "เน็ตบ้านโปร 199 + ฟรีแรกเข้า", link: "www.telemartubon/pro", views: 500, percent: 60, iconBg: "bg-purple-600" },
    { name: "เน็ตบ้านโปร 999 + ฟรีกล่องสัญญาณ", link: "www.telemartubon/pro", views: 12142, percent: 10, iconBg: "bg-blue-600" },
    { name: "ซิมเน็ตรายเดือน10Gbps", link: "www.telemartubon/pro", views: 12323, percent: 100, iconBg: "bg-yellow-500" },
    { name: "ซิมเน็ตรายเดือนไม่อั้นไม่ลดสปีด", link: "www.telemartubon/pro", views: 4543, percent: 100, iconBg: "bg-green-500" },
    { name: "โซล่าเซลล์ แบบขนาด 5เมตร 600kwh", link: "www.telemartubon/pro", views: 1434, percent: 25, iconBg: "bg-blue-400" },
    { name: "โซล่าเซลล์ แบบขนาด 100เมตร 6000kwh", link: "www.telemartubon/pro", views: 45465, percent: 40, iconBg: "bg-red-500" },
  ];

  return (
    <div className="space-y-6 mt-12 pt-8 border-t border-gray-800">
      <div>
        <h2 className="text-2xl font-bold text-white leading-none">Website Analytics (Mock Data)</h2>
        <p className="text-gray-400 mt-2">ส่วนนี้เป็นการทำงานด้วย Mock Data (รอการเชื่อมต่อจาก Google Analytics จริงในอนาคต)</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topStats.map((stat, i) => (
          <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex justify-between items-center hover:border-gray-700 transition-all">
            <div>
              <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-white">{stat.value}</span>
                <span className={`text-sm font-bold flex items-center ${stat.isPositive ? "text-emerald-400" : "text-red-400"}`}>
                  {stat.percent}
                </span>
              </div>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${stat.color} shadow-${stat.color.replace('bg-', '')}/20`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Middle Sections (Mock Charts and Banners) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Built by developers banner (Mock) */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between overflow-hidden relative">
           <div className="relative z-10 w-full md:w-3/5">
             <p className="text-gray-400 text-sm mb-1 font-medium">กล่องสำหรับเนื้อหาในอนาคต</p>
             <h3 className="text-xl font-bold text-white mb-2">กล่องสำหรับเนื้อหาในอนาคต</h3>
             <p className="text-gray-400 text-sm mb-6 leading-relaxed">
               กล่องสำหรับเนื้อหาในอนาคต
             </p>
             <div className="flex items-center gap-1 text-white text-sm font-medium hover:text-emerald-400 cursor-pointer w-max transition-colors">
               Read more
               <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
             </div>
           </div>
           
           <div className="mt-6 md:mt-0 flex w-full md:w-2/5 justify-end items-center">
              <div className="rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 w-full h-48 md:w-40 md:h-40 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <span className="text-white font-bold text-2xl flex items-center gap-2">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    เว้นไว้
                  </span>
              </div>
           </div>
        </div>

        {/* Work with the Rockets Banner */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden relative min-h-[250px] flex items-end p-8 group">
          {/* Subtle background placeholder (since we don't have the image) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700 z-0 transition-transform duration-700 group-hover:scale-105"></div>
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          
          <div className="relative z-20 w-full">
            <h3 className="text-2xl font-bold text-white mb-2">กล่องสำหรับเนื้อหาในอนาคต</h3>
            <p className="text-gray-300 text-sm mb-4 max-w-sm line-clamp-3">
              กล่องสำหรับเนื้อหาในอนาคต
            </p>
            <div className="flex items-center gap-1 text-white text-sm font-medium hover:text-emerald-400 cursor-pointer w-max transition-colors">
               Read more
               <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
            
            <div className="absolute top-4 right-4 text-center">
              <span className="text-gray-400/80 text-xs font-medium border border-gray-600/30 rounded px-2 py-1 border-dashed bg-black/20 backdrop-blur-sm">เว้นไว้สำหรับใส่เนื้อหาในอนาคต</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts (Mock) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users Chart */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          {/* Fake Bar Chart */}
          <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-xl p-4 h-56 mb-6 flex items-end gap-3 justify-center pb-6 shadow-inner relative">
             <div className="w-3 bg-white rounded-t-sm h-[20%]"></div>
             <div className="w-3 bg-white rounded-t-sm h-[40%]"></div>
             <div className="w-3 bg-white rounded-t-sm h-[30%]"></div>
             <div className="w-3 bg-white rounded-t-sm h-[70%] mb-4"></div>
             <div className="w-3 bg-white rounded-t-sm h-[80%]"></div>
             <div className="w-3 bg-white rounded-t-sm h-[50%] mt-2"></div>
             <div className="w-3 bg-white rounded-t-sm h-[90%]"></div>
             <div className="w-3 bg-white rounded-t-sm h-[60%]"></div>
             <div className="w-3 bg-white rounded-t-sm h-[80%] mt-3"></div>
             <div className="w-3 bg-white rounded-t-sm h-[60%] mb-1"></div>
             <div className="w-3 bg-white rounded-t-sm h-[40%]"></div>
             
             <div className="absolute left-4 top-4 flex flex-col gap-4 text-[10px] text-gray-500 h-[calc(100%-24px)] justify-between">
               <span>500</span><span>400</span><span>300</span><span>200</span><span>100</span><span>0</span>
             </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Active Users</h3>
            <p className="text-emerald-400 text-sm font-medium mt-1">(+23) <span className="text-gray-500 font-normal">than last week</span></p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-gray-400 text-xs flex items-center gap-2 mb-2 font-medium">
                  <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                  </span> 
                  Users
                </p>
                <p className="text-white font-bold text-xl">32,984</p>
                <div className="w-full bg-gray-800 h-1.5 mt-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 w-[60%] h-full"></div>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs flex items-center gap-2 mb-2 font-medium">
                  <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                  </span> 
                  Clicks
                </p>
                <p className="text-white font-bold text-xl">2.42m</p>
                <div className="w-full bg-gray-800 h-1.5 mt-2 rounded-full overflow-hidden">
                  <div className="bg-blue-400 w-[80%] h-full"></div>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs flex items-center gap-2 mb-2 font-medium">
                  <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px]">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
                  </span> 
                  Sales
                </p>
                <p className="text-white font-bold text-xl">2,400$</p>
                <div className="w-full bg-gray-800 h-1.5 mt-2 rounded-full overflow-hidden">
                  <div className="bg-purple-400 w-[40%] h-full"></div>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs flex items-center gap-2 mb-2 font-medium">
                  <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>
                  </span> 
                  Items
                </p>
                <p className="text-white font-bold text-xl">320</p>
                <div className="w-full bg-gray-800 h-1.5 mt-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 w-[50%] h-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Overview Chart (Mock Line Chart) */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col">
          <div className="mb-4">
             <h3 className="text-xl font-bold text-white mb-1">Sales overview</h3>
             <p className="text-emerald-400 text-sm font-medium">(+5) more <span className="text-gray-500 font-normal">in 2021</span></p>
          </div>
          
          <div className="relative flex-grow min-h-[220px] w-full mt-4">
            {/* Mock chart axes & lines */}
            <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between z-0">
              {[500,400,300,200,100,0].map((val) => (
                <div key={val} className="border-b border-gray-800 w-full mb-1 flex items-end">
                   <span className="text-xs text-gray-500 absolute -left-2 -translate-x-full">{val}</span>
                </div>
              ))}
            </div>
            
            <div className="absolute bottom-0 inset-x-0 ml-8 flex justify-between pr-2 text-xs text-gray-500 z-0">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                <span key={m}>{m}</span>
              ))}
            </div>

            {/* Mock SVG line chart */}
            <svg className="absolute inset-0 h-[85%] w-full ml-4 z-10 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
               {/* Background line */}
               <path d="M0,70 L10,65 L20,70 L30,68 L40,60 L50,55 L60,65 L70,80 L80,75 L90,65 L100,70" fill="none" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
               <path d="M0,70 L10,65 L20,70 L30,68 L40,60 L50,55 L60,65 L70,80 L80,75 L90,65 L100,70 L100,100 L0,100 Z" fill="url(#grad2)" opacity="0.4" />
               
               {/* Foreground line */}
               <path d="M0,60 Q10,20 20,60 T40,40 T50,50 T65,30 T80,60 T100,30" fill="none" stroke="#2dd4bf" strokeWidth="2.5" />
               <path d="M0,60 Q10,20 20,60 T40,40 T50,50 T65,30 T80,60 T100,30 L100,100 L0,100 Z" fill="url(#grad1)" opacity="0.6" />
               
               <defs>
                 <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                   <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
                   <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                 </linearGradient>
                 <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                   <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.3" />
                   <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
                 </linearGradient>
               </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">เนื้อหาที่ได้รับยอดความนิยมสูง</h3>
              <p className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                30 done <span className="text-gray-500 font-normal">this month</span>
              </p>
            </div>
             <button className="text-gray-400 hover:text-white transition-colors">
                <MoreVertIcon />
             </button>
          </div>
          
          <div className="min-w-[650px]">
            <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider font-medium">
              <div className="col-span-5 px-4">COMPANIES</div>
              <div className="col-span-3 text-center">link สินค้า</div>
              <div className="col-span-2 text-center">ยอดเข้าชม</div>
              <div className="col-span-2 text-center">คิดเป็นค่าเฉลี่ย</div>
            </div>
            
            <div className="flex flex-col">
              {topContent.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 py-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors items-center">
                  <div className="col-span-5 flex items-center gap-4 px-4">
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${item.iconBg} shadow-sm shadow-${item.iconBg.replace('bg-', '')}/50`}>
                      {item.name.substring(0, 1)}
                    </div>
                    <span className="text-sm font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis" title={item.name}>{item.name}</span>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <Link href="#" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors">
                      {item.link}
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </Link>
                  </div>
                  <div className="col-span-2 text-center text-sm font-bold text-white">
                    {item.views.toLocaleString()}
                  </div>
                  <div className="col-span-2 px-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-white whitespace-nowrap">{item.percent}%</span>
                      <div className="flex-grow h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.percent >= 60 ? 'bg-emerald-400' : item.percent >= 30 ? 'bg-blue-400' : 'bg-purple-400'}`} style={{ width: `${item.percent}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Empty Box as requested */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex items-center justify-center flex-col min-h-[300px]">
           <svg className="w-16 h-16 text-gray-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
           <p className="text-gray-400 mb-4 text-center font-medium">ส่วนพื้นที่สำหรับเครื่องมืออื่นๆ</p>
           <span className="text-gray-500 text-sm font-medium border border-gray-700 rounded-lg px-6 py-3 border-dashed bg-gray-800/30">
             รอข้อมูลจาก Google Analytics นำมาแสดง
           </span>
        </div>
      </div>
    </div>
  );
}
