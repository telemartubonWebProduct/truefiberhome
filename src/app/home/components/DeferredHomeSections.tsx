"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentProps } from "react";

const PromotionPresent = dynamic(() => import("./promotion-present"), {
  ssr: false,
  loading: () => <div className="min-h-[520px]" aria-hidden="true" />,
});
const SalerService = dynamic(() => import("./saler-service"), {
  ssr: false,
  loading: () => <div className="min-h-[420px]" aria-hidden="true" />,
});
const ContactSection = dynamic(() => import("./contact-section"), {
  ssr: false,
  loading: () => <div className="min-h-[360px]" aria-hidden="true" />,
});

type DeferredHomeSectionsProps = {
  promotionProps: ComponentProps<typeof PromotionPresent>;
  agents: ComponentProps<typeof SalerService>["agents"];
  contactProps: ComponentProps<typeof ContactSection>;
};

export default function DeferredHomeSections({
  promotionProps,
  agents,
  contactProps,
}: DeferredHomeSectionsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !("IntersectionObserver" in window)) {
      setReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setReady(true);
        observer.disconnect();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sentinelRef}>
      {ready ? (
        <>
          {promotionProps.isActive ? (
            <section
              id="packages"
              className="scroll-mt-24 bg-white px-4 py-16 md:px-10 md:py-24"
            >
              <h2 className="mb-10 max-w-5xl text-3xl leading-tight font-semibold text-black md:text-5xl">
                สัมผัสความเร็วเหนือระดับ กับโปรโมชั่นเน็ตบ้านที่ดีที่สุดสำหรับคุณ
              </h2>
              <PromotionPresent {...promotionProps} />
            </section>
          ) : null}
          <SalerService agents={agents} />
          <ContactSection {...contactProps} />
        </>
      ) : (
        <div className="min-h-[980px]" aria-hidden="true" />
      )}
    </div>
  );
}
