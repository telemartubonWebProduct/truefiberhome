"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type LazyHeroVideoProps = {
  src: string;
  poster?: string;
};

export default function LazyHeroVideo({ src, poster }: LazyHeroVideoProps) {
  const [videoSrc, setVideoSrc] = useState<string | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const shouldSkipVideo =
      !window.matchMedia("(min-width: 1024px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      connection?.saveData ||
      connection?.effectiveType === "2g" ||
      connection?.effectiveType === "slow-2g";
    if (shouldSkipVideo) return;

    let loaded = false;
    const loadVideo = () => {
      if (loaded) return;
      loaded = true;
      setVideoSrc(src);
    };
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown"];
    events.forEach((event) =>
      window.addEventListener(event, loadVideo, { once: true, passive: true })
    );
    const timeoutId = window.setTimeout(loadVideo, 12_000);

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, loadVideo));
    };
  }, [src]);

  return (
    <>
      {poster ? (
        <Image
          src={poster}
          alt=""
          aria-hidden
          fill
          fetchPriority="high"
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      ) : null}
      {videoSrc ? (
        <video
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onLoadedData={() => setReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </>
  );
}
