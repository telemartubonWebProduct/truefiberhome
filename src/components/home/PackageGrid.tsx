"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import type { HomePackage } from "@/src/lib/home-packages";
import { trackLineClick } from "@/src/lib/track-event";
import HomeIcon from "./HomeIcon";
import PackageName from "./PackageName";
import { PACKAGE_ART, formatPrice } from "./package-art";

const ALL = "ทั้งหมด";

/**
 * Every package is rendered into the HTML. The filter only toggles `hidden`,
 * so crawlers and visitors without JavaScript still get the full list.
 */
export default function PackageGrid({ packages }: { packages: HomePackage[] }) {
  const [active, setActive] = useState(ALL);
  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(packages.map((item) => item.category)))],
    [packages],
  );

  return (
    <>
      <div className="head rv">
        <div>
          <h2>
            <span className="nb">โปรเน็ตบ้านทรู</span> <span className="nb">เลือกแบบที่ใช่</span>
          </h2>
          <p className="sub">ราคา ความเร็ว และระยะสัญญาอยู่บนการ์ดครบ</p>
        </div>
        <div className="tabs" role="group" aria-label="กรองแพ็กเกจ">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={active === category}
              onClick={() => setActive(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="pkgs">
        {packages.map((item, index) => {
          const art = PACKAGE_ART[item.art];
          const meta = [item.speedLabel, item.termLabel].filter(Boolean).join(" · ");
          const style = { "--bg": art.color, "--d": `${(index % 3) * 90}ms` } as CSSProperties;

          return (
            <article
              key={item.id}
              className={`pk rv${item.hot ? " hot" : ""}`}
              style={style}
              hidden={active !== ALL && item.category !== active}
            >
              <span className="cat">{item.hot ? "ราคาเริ่มต้น" : item.category}</span>
              <div className="art">
                <Image src={art.src} alt="" width={art.width} height={art.height} sizes="170px" />
              </div>
              <h3>
                <PackageName name={item.name} />
              </h3>
              {meta ? <span className="spd">{meta}</span> : null}
              <div className="price">
                <b>{formatPrice(item.price)}</b>
                <span>
                  บาท
                  <br />
                  ต่อเดือน
                </span>
              </div>
              {item.perks.length > 0 ? (
                <ul>
                  {item.perks.map((perk) => (
                    <li key={perk}>
                      <HomeIcon name="check" />
                      {perk}
                    </li>
                  ))}
                </ul>
              ) : null}
              <a
                className={`btn ${item.hot ? "btn-r" : "btn-k"}`}
                href={item.buyUrl}
                onClick={() => trackLineClick(`home_package_${item.id}`, item.buyUrl)}
              >
                เช็กพื้นที่และสมัคร
                <span className="sr"> {item.name}</span>
              </a>
            </article>
          );
        })}
      </div>
    </>
  );
}
