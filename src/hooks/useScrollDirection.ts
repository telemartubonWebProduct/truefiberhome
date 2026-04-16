"use client";

import { useState, useEffect, useRef } from "react";

export function useHideOnScroll(threshold: number = 50) {
  const [hidden, setHidden] = useState(false);
  const lastPositionRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentPos = window.scrollY;
      const diff = currentPos - lastPositionRef.current;
      
      if (currentPos < 20) {
        setHidden(false);
        lastPositionRef.current = currentPos;
        return;
      }

      if (diff > threshold && !hidden) {
        setHidden(true);
        lastPositionRef.current = currentPos;
      }

      else if (diff < -threshold && hidden) {
        setHidden(false);
        lastPositionRef.current = currentPos;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hidden, threshold]);

  return hidden;
}
