import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import Link from "next/link";
import { menuItems as defaultMenuItems } from "@/src/data/home";

interface MenuCategoryFromDB {
  id: string;
  iconUrl: string;
  alt: string;
  text: string;
  path: string;
  displayOrder: number;
  isActive: boolean;
}

interface HeaderBarProps {
  menuCategories?: MenuCategoryFromDB[];
}

export default function SectionMenu({ menuCategories }: HeaderBarProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Use DB data if available, fall back to static data
  const items =
    menuCategories && menuCategories.length > 0
      ? menuCategories.map((mc) => ({ src: mc.iconUrl, alt: mc.alt, text: mc.text, path: mc.path }))
      : defaultMenuItems;

  return (
    <Box
      component="nav"
      aria-label="เมนูหมวดหมู่บริการ"
      className="w-full h-full justify-center items-center flex pt-10 pb-4 mx-auto bg-white"
    >
      <Swiper
        modules={[FreeMode]}
        spaceBetween={isSmallScreen ? 10 : 20}
        slidesPerView="auto"
        freeMode={true}
        className="mySwiper"
      >
        {items.map((item, index) => (
          <SwiperSlide key={index} style={{ width: "auto" }}>
            <Link href={item.path} scroll={true} aria-label={item.text}>
              <Box className="flex flex-col justify-center items-center group cursor-pointer">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={isSmallScreen ? 60 : 100}
                  height={isSmallScreen ? 60 : 100}
                  className="text-gray-500 group-hover:text-[#FB4141]"
                />
                <Typography
                  variant={isSmallScreen ? "body2" : "h6"}
                  sx={{ fontFamily: "Prompt" }}
                  className="font-bold text-gray-600 group-hover:text-[#FB4141] text-center"
                >
                  {item.text}
                </Typography>
              </Box>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}
