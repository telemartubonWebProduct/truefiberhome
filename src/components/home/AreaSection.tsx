"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import type { Region } from "@/src/data/provinces";

/** The province shown large on each region's card. Falls back to the region's first province. */
const FEATURED: Record<string, string> = {
  ภาคอีสาน: "ขอนแก่น",
  ภาคกลาง: "กรุงเทพมหานคร",
  ภาคเหนือ: "เชียงใหม่",
  ภาคตะวันออก: "ชลบุรี",
  ภาคตะวันตก: "กาญจนบุรี",
  ภาคใต้: "ภูเก็ต",
};

/**
 * Card deck on the left, region tabs and province lists on the right.
 * `stack` holds region names from bottom to top; picking a region moves its card to the top.
 * All regions are in the HTML; the tabs only toggle `hidden`.
 */
export default function AreaSection({ regions, children }: { regions: Region[]; children?: ReactNode }) {
  const [stack, setStack] = useState(() => regions.map((region) => region.name).reverse());
  const [picked, setPicked] = useState(false);
  const active = stack[stack.length - 1] ?? "";

  const pick = (name: string) => {
    if (name === active) return;
    setStack((current) => [...current.filter((item) => item !== name), name]);
    setPicked(true);
  };

  return (
    <>
      <div className="rv">
        <div className={picked ? "deck picked" : "deck"} aria-hidden="true">
          {regions.map((region) => {
            const depth = stack.length - 1 - stack.indexOf(region.name);
            return (
              <div key={region.name} className={`p${Math.min(depth, 3)}`}>
                <span>
                  {FEATURED[region.name] ?? region.provinces[0]}
                  <small>
                    {region.name} {region.provinces.length} จังหวัด
                  </small>
                </span>
                <Image src="/assets/home/k-house.webp" alt="" width={377} height={340} sizes="150px" />
              </div>
            );
          })}
        </div>
      </div>
      <div className="rv">
        {children}
        <div className="tabs wrap-tabs" role="group" aria-label="เลือกภูมิภาค" style={{ marginTop: 26 }}>
          {regions.map((region) => (
            <button
              key={region.name}
              type="button"
              aria-pressed={active === region.name}
              onClick={() => pick(region.name)}
            >
              {region.name}
            </button>
          ))}
        </div>
        {regions.map((region) => (
          <ul key={region.name} className="prov" aria-label={region.name} hidden={active !== region.name}>
            {region.provinces.map((province) => (
              <li key={province}>{province}</li>
            ))}
          </ul>
        ))}
      </div>
    </>
  );
}
