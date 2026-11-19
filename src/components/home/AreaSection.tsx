"use client";

import { useState } from "react";
import type { Region } from "@/src/data/provinces";

/** All regions are in the HTML; the tabs only toggle `hidden`. */
export default function AreaSection({ regions }: { regions: Region[] }) {
  const [active, setActive] = useState(regions[0]?.name ?? "");

  return (
    <>
      <div className="tabs" role="group" aria-label="เลือกภูมิภาค" style={{ marginTop: 26 }}>
        {regions.map((region) => (
          <button
            key={region.name}
            type="button"
            aria-pressed={active === region.name}
            onClick={() => setActive(region.name)}
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
    </>
  );
}
