"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import "./hero-motion.css";
import TrackedLineLink from "@/src/app/home/components/TrackedLineLink";
import type { HeroPlan, HomeArt, LeadPlan } from "@/src/lib/home-packages";
import LeadForm from "./LeadForm";
import { formatPrice } from "./package-art";

type Prop = {
  s: HomeArt;
  src: string;
  width: number;
  height: number;
  /** "land" drops in from above and settles, "pop" scales up in place. */
  kind?: "land" | "pop";
  /** Position plus the CSS variables read by `.hm-sc` (see hero-motion.css). */
  style: Record<string, string>;
};

/** Every plan brings its own props and its own pose of the mascot. */
const PROPS: Prop[] = [
  // ทั่วไป: เราเตอร์เลื่อนเข้าจากซ้าย
  { s: "net", src: "h-router", width: 560, height: 582, style: { left: "26%", bottom: "-4%", "--w": "21%", "--wm": "34%", "--tx0": "-120vw" } },
  // ดูหนัง: ทีวีตกจากบน โซฟาเลื่อนจากขวา น้องฟ้าลงนั่ง
  { s: "movie", src: "p-tv", width: 674, height: 655, style: { right: "5%", top: "3%", "--w": "19%", "--wm": "25%", "--tx": "0%", "--tx0": "0%", "--ty0": "-190%", "--r0": "-6deg", "--dl": ".15s", "--ez": "cubic-bezier(.3,1.4,.5,1)" } },
  { s: "movie", src: "p-sofa", width: 760, height: 413, style: { left: "50%", bottom: "-12%", "--w": "46%", "--wm": "82%", "--tx0": "120vw" } },
  { s: "movie", src: "fah-movie", width: 485, height: 1200, kind: "land", style: { left: "50%", bottom: "-21%", "--h": "95%", "--dl": ".5s" } },
  // เล่นเกม: จอตกลงมา เก้าอี้ขึ้นจากล่าง น้องฟ้าลงนั่ง
  { s: "game", src: "p-monitor", width: 605, height: 513, style: { left: "21%", top: "6%", "--w": "24%", "--wm": "36%", "--ty0": "-200%", "--r0": "5deg", "--dl": ".15s", "--ez": "cubic-bezier(.3,1.4,.5,1)" } },
  { s: "game", src: "p-chair", width: 493, height: 768, style: { left: "50%", bottom: "-34%", "--h": "112%", "--ty0": "120%" } },
  { s: "game", src: "fah-game", width: 363, height: 1026, kind: "land", style: { left: "50%", bottom: "-22%", "--h": "92%", "--dl": ".5s" } },
  // กล้องวงจรปิด: กล้องหย่อนลงมา น้องฟ้าดูภาพจากมือถือ
  { s: "cctv", src: "h-cctv", width: 354, height: 453, style: { left: "22%", top: "8%", "--w": "15%", "--wm": "24%", "--ty0": "-240%", "--dl": ".2s", "--ez": "cubic-bezier(.3,1.4,.5,1)" } },
  { s: "cctv", src: "fah-cctv", width: 459, height: 1045, style: { left: "47%", bottom: "-24%", "--h": "112%", "--ty0": "120%", "--dl": ".1s" } },
  // บ้านหลายชั้น: บ้าน 2 ชั้นเลื่อนเข้าจากซ้าย ตัว Mesh เด้งขึ้นทีละชั้น
  { s: "mesh", src: "p-house2", width: 568, height: 697, style: { left: "30%", bottom: "-6%", "--h": "94%", "--hm": "74%", "--tx0": "-120vw" } },
  { s: "mesh", src: "h-mesh", width: 340, height: 361, kind: "pop", style: { left: "19%", top: "24%", "--w": "6%", "--wm": "11%", "--dl": ".8s" } },
  { s: "mesh", src: "h-mesh", width: 340, height: 361, kind: "pop", style: { left: "19%", top: "60%", "--w": "6%", "--wm": "11%", "--dl": "1s" } },
  { s: "mesh", src: "fah-mesh", width: 508, height: 1028, style: { left: "63%", bottom: "-24%", "--h": "112%", "--ty0": "120%", "--dl": ".25s" } },
];

const LAYERS = ["hm-l0", "hm-l1", "hm-l2", "hm-front"];
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Animated hero: a stacked odometer price, the mascot, and one scene per plan.
 * Picking a chip rolls the price and swaps the scene. The first plan is rendered
 * on the server, so the heading and price are in the HTML without JavaScript.
 */
export default function HeroMotion({
  plans,
  leadPlans,
  lineHref,
}: {
  plans: HeroPlan[];
  /** Every package, for the plan picker inside the lead form. */
  leadPlans: LeadPlan[];
  lineHref: string;
}) {
  const [current, setCurrent] = useState(plans[0].k);
  const [previous, setPrevious] = useState<HomeArt | null>(null);
  const [armed, setArmed] = useState(false);
  const [still, setStill] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const root = useRef<HTMLElement>(null);

  const plan = plans.find((item) => item.k === current) ?? plans[0];
  const width = Math.max(...plans.map((item) => String(Math.round(item.price)).length));
  const digits = String(Math.round(plan.price)).padStart(width, " ").split("");

  // Scenes other than the first are mounted after load so they do not compete with it.
  useEffect(() => {
    const timer = window.setTimeout(() => setArmed(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  // Pointer parallax, written straight to CSS variables to avoid re-rendering.
  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = element.getBoundingClientRect();
      element.style.setProperty("--px", (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
      element.style.setProperty("--py", (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
    };
    const leave = () => {
      element.style.setProperty("--px", "0");
      element.style.setProperty("--py", "0");
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", leave);
    return () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
    };
  }, []);

  const pick = (k: HomeArt) => {
    if (k === current) return;
    setArmed(true);
    setPrevious(current);
    setCurrent(k);
  };

  const first = plans[0].k;
  const classes = ["hero", "hm", current !== first ? "hm-scene-on" : "", still ? "hm-still" : ""].filter(Boolean).join(" ");

  return (
    <section className={classes} id="tfh-hero" ref={root}>
      <div className="hm-stage">
        <div className="hm-pulse" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="hm-num" aria-hidden="true">
          <div className="hm-box">
            {LAYERS.map((layer) => (
              <div key={layer} className={`hm-layer ${layer}`}>
                {digits.map((digit, index) => (
                  <span key={index} className={digit === " " ? "hm-win hm-blank" : "hm-win"}>
                    <span className="hm-strip" style={{ "--d": digit === " " ? 0 : Number(digit), "--i": index } as CSSProperties}>
                      {DIGITS.map((n) => (
                        <span key={n}>{n}</span>
                      ))}
                    </span>
                  </span>
                ))}
              </div>
            ))}
            <b className="hm-unit">บาท/เดือน</b>
          </div>
        </div>
        <div className="hm-orb" aria-hidden="true">
          <Image src="/assets/home/h-house.webp" alt="" width={374} height={347} sizes="240px" />
        </div>
        <div className="hm-scene" aria-hidden="true">
          {PROPS.filter((prop) => armed || prop.s === first).map((prop, index) => {
            const state = prop.s === current ? "in" : prop.s === previous ? "out" : "";
            return (
              <Image
                key={`${prop.src}-${index}`}
                className={["hm-sc", prop.kind ? `hm-${prop.kind}` : "", state].filter(Boolean).join(" ")}
                src={`/assets/home/${prop.src}.webp`}
                alt=""
                width={prop.width}
                height={prop.height}
                sizes="(max-width: 759px) 80vw, 520px"
                // Props wait off-screen, where lazy loading would never fetch them.
                loading="eager"
                style={prop.style as CSSProperties}
              />
            );
          })}
        </div>
        <div className="hm-who">
          <Image
            src="/assets/home/fah-point.webp"
            alt="น้องฟ้า มาสคอตของร้าน ชี้ไปที่ราคาโปรเน็ตบ้านทรู"
            width={796}
            height={1100}
            sizes="(max-width: 759px) 60vw, 420px"
            priority
          />
        </div>
      </div>

      <div className="wrap">
        <div className="hm-panel">
          <div>
            <h1>
              <span className="nb">สมัครเน็ตบ้านทรู</span>{" "}
              <em key={plan.k} className="nb hm-flip">
                {plan.k === first ? "เริ่ม" : "โปรนี้"} {formatPrice(plan.price)} บาท/เดือน
              </em>
            </h1>
            <p className="hm-lead">
              ไฟเบอร์แท้พร้อมเราเตอร์ WiFi 6 ส่งตำแหน่งบ้านมา เจ้าหน้าที่เช็กคู่สายและนัดวันติดตั้งให้
            </p>
            <p className="hm-trust">
              ดำเนินการโดย บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด ตัวแทนจำหน่ายทรูออนไลน์ที่ได้รับการแต่งตั้ง
            </p>
          </div>
          <div className="hm-pick">
            <div className="hm-now" aria-live="polite">
              <div key={plan.k} className="hm-info hm-flip">
                <strong>{plan.name}</strong>
                <span>{plan.meta}</span>
              </div>
              <div className="hm-fig">
                <b>{formatPrice(plan.price)}</b>
                <small>
                  บาท
                  <br />
                  ต่อเดือน
                </small>
              </div>
              <button type="button" className="btn hm-cta" onClick={() => setFormOpen(true)}>
                เช็กพื้นที่ติดตั้ง
              </button>
            </div>
            <p className="hm-alt">
              หรือ{" "}
              <TrackedLineLink href={lineHref} source="home_hero" className="hm-alt-link">
                คุยทาง LINE เลย
              </TrackedLineLink>
            </p>
            {plans.length > 1 && (
              <div className="hm-choose">
                <b>บ้านคุณใช้เน็ตทำอะไร</b>
                <div className="hm-chips" role="group" aria-label="เลือกแบบการใช้งาน">
                  {plans.map((item) => (
                    <button key={item.k} type="button" aria-pressed={item.k === current} onClick={() => pick(item.k)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LeadForm plans={leadPlans} planId={plan.id} open={formOpen} onClose={() => setFormOpen(false)} />

      <button className="hm-stop" type="button" aria-pressed={still} onClick={() => setStill((value) => !value)}>
        {still ? "เล่นการเคลื่อนไหว" : "หยุดการเคลื่อนไหว"}
      </button>
    </section>
  );
}
