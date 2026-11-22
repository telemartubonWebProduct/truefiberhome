"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import "./lead-form.css";
import TrackedLineLink from "@/src/app/home/components/TrackedLineLink";
import { CONSENT_KEY } from "@/src/lib/consent";
import type { LeadPlan } from "@/src/lib/home-packages";
import { LINE_ADD_FRIEND_URL, leadMessage, lineMessageUrl, normalizePhone } from "@/src/lib/lead";
import { hasTrackingConsent, newEventId, trackMetaEvent } from "@/src/lib/meta-pixel";
import { formatPrice } from "./package-art";
import type { Pin } from "./LeadMap";

const LeadMap = dynamic(() => import("./LeadMap"), {
  ssr: false,
  loading: () => <div className="lf-map lf-map-loading">กำลังโหลดแผนที่</div>,
});

/** "line": the site could not take the lead, so the visitor sends it in LINE instead. */
type Step = 1 | 2 | 3 | "done" | "line";

const STEPS = ["เลือกโปร", "ข้อมูลติดต่อ", "ตำแหน่งติดตั้ง"];

/**
 * Three-step install request: plan, contact details, install location.
 * Opens as a modal dialog. On success it shows the reference code and asks the
 * visitor to add the shop on LINE.
 */
export default function LeadForm({
  plans,
  planId,
  open,
  onClose,
}: {
  plans: LeadPlan[];
  /** The plan chosen on the page when the form was opened. */
  planId: string;
  open: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState(planId);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState<Pin | null>(null);
  const [addressNote, setAddressNote] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [lineText, setLineText] = useState("");

  const plan = plans.find((item) => item.id === selected) ?? plans[0];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      setSelected(planId);
      setStep((current) => (current === "done" || current === "line" ? 1 : current));
      element.showModal();
    }
    if (!open && element.open) element.close();
  }, [open, planId]);

  const next = () => {
    if (step === 1) return setStep(2);
    if (step === 2) {
      const found: Record<string, string> = {};
      if (fullName.trim().length < 2) found.fullName = "กรุณากรอกชื่อ";
      if (!normalizePhone(phone)) found.phone = "กรุณากรอกเบอร์โทร 9 ถึง 10 หลัก";
      setErrors(found);
      if (Object.keys(found).length === 0) setStep(3);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step !== 3) return next();
    if (!pin && addressNote.trim().length < 5) {
      setErrors({ location: "กรุณาเลื่อนแผนที่ไปยังจุดติดตั้ง หรือพิมพ์ที่อยู่ติดตั้ง" });
      return;
    }

    setErrors({});
    setSending(true);
    const eventId = newEventId();
    const consent = hasTrackingConsent(CONSENT_KEY);
    const lead = {
      fullName: fullName.trim(),
      phone: normalizePhone(phone) ?? phone.trim(),
      packageName: `${plan.name} ${formatPrice(plan.price)} บาท/เดือน`,
      packageInfo: plan.info || null,
      latitude: pin?.latitude ?? null,
      longitude: pin?.longitude ?? null,
      addressNote: addressNote.trim() || null,
      source: window.location.pathname,
    };
    // When the site cannot take the lead, the visitor sends the same text in LINE.
    const handOverToLine = () => {
      setLineText(leadMessage({ ...lead, source: null }, "ส่งจากหน้าเว็บ"));
      setStep("line");
    };
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, website, eventId, consent }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status >= 500) return handOverToLine();
      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? { form: result.error ?? "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่" });
        if (result.errors?.fullName || result.errors?.phone) setStep(2);
        return;
      }
      if (consent) trackMetaEvent("Lead", { content_name: plan.name }, eventId);
      setRefCode(result.refCode);
      setStep("done");
    } catch {
      handOverToLine();
    } finally {
      setSending(false);
    }
  };

  const finished = step === "done" || step === "line";
  const current = finished ? 4 : step;
  const title = step === "done" ? "ส่งข้อมูลเรียบร้อย" : step === "line" ? "ส่งต่อทาง LINE" : "เช็กพื้นที่ติดตั้ง";

  return (
    <dialog ref={dialog} className="lf" aria-labelledby="lf-title" onClose={onClose}>
      <form className="lf-box" onSubmit={submit} noValidate>
        <header className="lf-head">
          <h2 id="lf-title">{title}</h2>
          <button type="button" className="lf-close" onClick={onClose} aria-label="ปิด">
            ×
          </button>
        </header>

        {!finished && (
          <ol className="lf-steps">
            {STEPS.map((label, index) => (
              <li
                key={label}
                className={index + 1 < current ? "is-done" : index + 1 === current ? "is-now" : ""}
                aria-current={index + 1 === current ? "step" : undefined}
              >
                <b>{index + 1}</b>
                <span>{label}</span>
              </li>
            ))}
          </ol>
        )}

        {step === 1 && (
          <div className="lf-body">
            <p className="lf-label">โปรที่คุณเลือก</p>
            <div className="lf-picked">
              <div>
                <strong>{plan.name}</strong>
                {plan.info && <span>{plan.info}</span>}
              </div>
              <div className="lf-price">
                <b>{formatPrice(plan.price)}</b>
                <small>บาท/เดือน</small>
              </div>
            </div>
            {plans.length > 1 && (
              <label className="lf-field">
                <span>เปลี่ยนเป็นโปรอื่น</span>
                <select value={plan.id} onChange={(event) => setSelected(event.target.value)}>
                  {plans.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {formatPrice(item.price)} บาท
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="lf-hint">ราคายังไม่รวมภาษีมูลค่าเพิ่ม เจ้าหน้าที่แจ้งยอดทั้งหมดก่อนยืนยันสมัคร</p>
          </div>
        )}

        {step === 2 && (
          <div className="lf-body">
            <label className="lf-field">
              <span>ชื่อ</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "lf-err-name" : undefined}
                maxLength={80}
                autoFocus
              />
              {errors.fullName && (
                <em id="lf-err-name" role="alert">
                  {errors.fullName}
                </em>
              )}
            </label>
            <label className="lf-field">
              <span>เบอร์โทร</span>
              <input
                type="tel"
                name="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08x-xxx-xxxx"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "lf-err-phone" : undefined}
                maxLength={20}
              />
              {errors.phone && (
                <em id="lf-err-phone" role="alert">
                  {errors.phone}
                </em>
              )}
            </label>
            {/* Honeypot: hidden from people, tempting to bots. */}
            <label className="lf-trap" aria-hidden="true">
              เว็บไซต์
              <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="lf-body">
            <p className="lf-label">เลื่อนแผนที่ให้หมุดอยู่ตรงบ้านที่จะติดตั้ง</p>
            <LeadMap onChange={setPin} />
            <p className="lf-hint" role="status">
              {pin ? "ได้ตำแหน่งแล้ว เลื่อนปรับได้จนกว่าจะตรง" : "ยังไม่ได้เลือกตำแหน่ง"}
            </p>
            <label className="lf-field">
              <span>ที่อยู่หรือจุดสังเกต (ถ้ามี)</span>
              <input
                type="text"
                name="address"
                autoComplete="street-address"
                placeholder="เช่น หมู่บ้าน ซอย ใกล้ร้านอะไร"
                value={addressNote}
                onChange={(event) => setAddressNote(event.target.value)}
                maxLength={300}
              />
            </label>
            {errors.location && (
              <p className="lf-error" role="alert">
                {errors.location}
              </p>
            )}
            {errors.form && (
              <p className="lf-error" role="alert">
                {errors.form}
              </p>
            )}
            <p className="lf-hint">
              เราใช้ชื่อ เบอร์โทร และตำแหน่งนี้เพื่อเช็กพื้นที่และติดต่อกลับเท่านั้น อ่าน{" "}
              <Link href="/privacy-policy" target="_blank">
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="lf-body lf-done">
            <p className="lf-ref">
              รหัสของคุณ <b>{refCode}</b>
            </p>
            <p>
              เจ้าหน้าที่ได้รับข้อมูลแล้ว แอด LINE แล้วแจ้งรหัสหรือชื่อในแชตได้เลย
              จะได้คุยต่อและนัดวันติดตั้งได้เร็วขึ้น
            </p>
            <TrackedLineLink href={LINE_ADD_FRIEND_URL} source="lead_success" className="btn lf-line">
              แอด LINE ร้าน
            </TrackedLineLink>
            <div className="lf-qr">
              <Image src="/assets/home/line-add-qr.svg" alt="คิวอาร์โค้ดสำหรับแอด LINE ร้าน" width={160} height={160} unoptimized />
              <span>หรือสแกนด้วยมือถือ</span>
            </div>
          </div>
        )}

        {step === "line" && (
          <div className="lf-body lf-done">
            <p>
              ระบบรับข้อมูลขัดข้องชั่วคราว ข้อมูลที่กรอกไว้ยังอยู่ครบ กดปุ่มด้านล่าง LINE
              จะเปิดพร้อมข้อความนี้ แล้วกดส่งในแชตได้เลย
            </p>
            <pre className="lf-text">{lineText}</pre>
            <TrackedLineLink href={lineMessageUrl(lineText)} source="lead_fallback" className="btn lf-line">
              ส่งข้อมูลทาง LINE
            </TrackedLineLink>
          </div>
        )}

        {!finished && (
          <footer className="lf-foot">
            {typeof step === "number" && step > 1 ? (
              <button type="button" className="btn btn-l" onClick={() => setStep((step - 1) as Step)} disabled={sending}>
                ย้อนกลับ
              </button>
            ) : (
              <span />
            )}
            <button type="submit" className="btn btn-k" disabled={sending}>
              {step === 3 ? (sending ? "กำลังส่ง" : "ส่งข้อมูล") : "ถัดไป"}
            </button>
          </footer>
        )}
        {finished && (
          <footer className="lf-foot">
            <span />
            <button type="button" className="btn btn-l" onClick={onClose}>
              ปิด
            </button>
          </footer>
        )}
      </form>
    </dialog>
  );
}
