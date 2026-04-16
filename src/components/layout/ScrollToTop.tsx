"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

const ScrollToTop = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    showButton && (
      <motion.button
        initial={{ opacity: 0, x: 200 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.3 }}
        onClick={scrollToTop}
        className="fixed bottom-10 right-5 bg-gray-500 text-white p-3 rounded-full shadow-lg hover:bg-black z-50"
      >
        <ArrowDropUpIcon/>
      </motion.button>
    )
  );
};

export default ScrollToTop;
