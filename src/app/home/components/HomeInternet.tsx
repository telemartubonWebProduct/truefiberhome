"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { homeInternetItems as defaultItems } from "@/src/data/home-internet";

interface HomeInternetProps {
  homeInternetData?: any[];
}

export default function HomeInternet({ homeInternetData }: HomeInternetProps) {
  // Use DB data with static fallback
  const items =
    homeInternetData && Array.isArray(homeInternetData) && homeInternetData.length > 0
      ? homeInternetData
      : defaultItems;

  return (
    <Box>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <Typography sx={{ fontFamily: "Prompt" }} variant="h5" component="h2" color="initial">
            เน็ตบ้าน
          </Typography>
        </div>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 cursor-pointer">
          {items.map((item: any, index: number) => (
            <motion.div
              key={index}
              className="flex flex-col rounded-3xl border border-gray-200 bg-white shadow-md"
              whileHover={{
                scale: 1.03,
                boxShadow: "0px 15px 35px rgba(0, 0, 0, 0.2), 0px 5px 15px rgba(0, 0, 0, 0.1)",
                transition: { duration: 0.35, ease: "easeInOut" },
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
            >
              <Link href={item.path} aria-label={`เน็ตบ้าน – ${item.title}`}>
                <div className="h-48 sm:h-56 mb-4 bg-gray-100 rounded-t-3xl overflow-hidden relative">
                  <img
                    src={item.img}
                    alt={`เน็ตบ้านทรูออนไลน์ – ${item.title}`}
                    width={600}
                    height={280}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg text-black font-semibold mb-2 px-4">
                  {item.title}
                </h3>
                <p className="mb-4 text-gray-600 px-4 text-sm leading-relaxed">
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto px-4 mb-4">
                  {item.promotion && item.promotion.map((promo: any, pIndex: number) => (
                    <img
                      key={pIndex}
                      src={promo.icon}
                      alt={promo.alt}
                      width={56}
                      height={56}
                      loading="lazy"
                      decoding="async"
                      className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                    />
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </Box>
  );
}