"use client";

import { useMemo, useState } from "react";
import type { HomePackage } from "@/src/lib/home-packages";
import { trackLineClick } from "@/src/lib/track-event";
import PackageName from "./PackageName";
import { formatPrice } from "./package-art";

type People = "s" | "m" | "l";
type Use = "basic" | "movie" | "game" | "floor" | "cctv";

const PEOPLE: { value: People; label: string }[] = [
  { value: "s", label: "1 ถึง 2 คน" },
  { value: "m", label: "3 ถึง 5 คน" },
  { value: "l", label: "6 คนขึ้นไป" },
];

const USES: { value: Use; label: string }[] = [
  { value: "basic", label: "ทั่วไป โซเชียล" },
  { value: "movie", label: "ดูหนัง ซีรีส์" },
  { value: "game", label: "เล่นเกม สตรีม" },
  { value: "floor", label: "บ้านหลายชั้น" },
  { value: "cctv", label: "อยากได้กล้องวงจรปิด" },
];

function recommend(packages: HomePackage[], people: People, use: Use): { item: HomePackage; why: string } {
  const sorted = [...packages].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0];
  const fast = sorted.filter((item) => (item.down ?? 0) >= 1000);
  const ofArt = (art: HomePackage["art"]) => sorted.filter((item) => item.art === art);
  const pick = (item: HomePackage | undefined, why: string) =>
    item ? { item, why } : { item: cheapest, why: "ราคาต่อเดือนต่ำที่สุดในแพ็กเกจที่เปิดรับสมัครตอนนี้" };

  if (use === "movie") {
    return pick(ofArt("movie")[0], "ได้คอนเทนต์ดูหนังซีรีส์มาพร้อมเน็ต ในราคาต่ำที่สุดของกลุ่มนี้");
  }
  if (use === "cctv") {
    const cameras = ofArt("cctv");
    return pick(
      people === "l" ? cameras[cameras.length - 1] : cameras[0],
      "ได้กล้องวงจรปิดมาพร้อมเน็ต ไม่ต้องซื้อแยก",
    );
  }
  if (use === "floor") return pick(ofArt("mesh")[0], "Mesh WiFi ช่วยให้สัญญาณถึงทุกชั้นของบ้าน");
  if (use === "game") {
    return pick(
      people === "s" ? fast[0] : fast[fast.length - 1],
      "ความเร็ว 1000 Mbps รองรับเล่นเกมและสตรีมพร้อมกันหลายเครื่อง",
    );
  }
  if (people === "l") return pick(fast[0], "คนใช้พร้อมกันหลายคน 1000 Mbps จะไม่แย่งความเร็วกัน");
  return { item: cheapest, why: "ใช้งานทั่วไปความเร็วนี้เพียงพอ และราคาต่อเดือนต่ำที่สุด" };
}

export default function SpeedChooser({ packages }: { packages: HomePackage[] }) {
  const [people, setPeople] = useState<People>("s");
  const [use, setUse] = useState<Use>("basic");
  const { item, why } = useMemo(() => recommend(packages, people, use), [packages, people, use]);
  const fill = item.down ? Math.min(1, item.down / 1000) : 0.5;

  return (
    <div className="wrap grid2">
      <div className="rv">
        <h2>
          <span className="nb">ต้องใช้ความเร็ว</span> <span className="nb">เท่าไหร่ดี</span>
        </h2>
        <p className="sub">ตอบ 2 ข้อ แล้วดูแพ็กเกจที่พอดีกับบ้านคุณ</p>
        <fieldset>
          <legend>บ้านคุณใช้เน็ตกี่คน</legend>
          <div className="opts">
            {PEOPLE.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={people === option.value}
                onClick={() => setPeople(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>ใช้ทำอะไรเป็นหลัก</legend>
          <div className="opts">
            {USES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={use === option.value}
                onClick={() => setUse(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="rv">
        <div className="slip" aria-live="polite">
          <small>แพ็กเกจที่เหมาะกับบ้านคุณ</small>
          <h3 key={item.id} className="swap">
            <PackageName name={item.name} />
          </h3>
          {item.speedLabel ? (
            <>
              <div className="meter">
                <i style={{ transform: `scaleX(${fill})` }} />
              </div>
              <div className="meterl">
                <span>ความเร็ว</span>
                <span>{item.speedLabel}</span>
              </div>
            </>
          ) : null}
          <p key={`${item.id}-why`} className="swap">
            {why}
          </p>
          <div className="foot">
            <div className="price">
              <b>{formatPrice(item.price)}</b>
              <span>
                บาท
                <br />
                ต่อเดือน
              </span>
            </div>
            <a
              className="btn btn-k"
              href={item.buyUrl}
              onClick={() => trackLineClick(`home_chooser_${item.id}`, item.buyUrl)}
            >
              เช็กพื้นที่
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
