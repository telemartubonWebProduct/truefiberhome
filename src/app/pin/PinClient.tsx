"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import {
  AUTO_LOCATE_PARAM,
  LOW_ACCURACY_METERS,
  THAILAND_VIEW,
  buildPinMessage,
  chromeIntentUrl,
  isAndroidInAppBrowser,
  messengerUrl,
  type PinEventName,
  type PinPage,
} from "@/src/lib/pin";
import type { LatLng } from "./PinMap";

const PinMap = dynamic(() => import("./PinMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
      กำลังโหลดแผนที่ค่ะ…
    </div>
  ),
});

type Phase = "start" | "locating" | "located" | "manual";
type CopyState = "idle" | "copied" | "manual";

type MapView = { lat: number; lng: number; zoom: number; key: number };

type SearchResult = { id: string; label: string; lat: number; lng: number };

type GtagWindow = typeof window & { gtag?: (...args: unknown[]) => void };

/** Anonymous counters only: the event name and the page key, never a coordinate. */
function sendEvent(name: PinEventName, page: PinPage) {
  try {
    track(name, { p: page.key });
  } catch {
    // Analytics must never break the page.
  }
  try {
    (window as GtagWindow).gtag?.("event", name, { p: page.key });
  } catch {
    // Same as above.
  }
}

const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 };
const NOMINATIM_MIN_GAP_MS = 1_100; // Nominatim allows one request per second.

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea route.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export default function PinClient({ page, autoLocate = false }: { page: PinPage; autoLocate?: boolean }) {
  // Android in-app browsers (Messenger, Facebook) never show the location prompt,
  // so there the main button opens this page in Chrome instead.
  const [chromeUrl, setChromeUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("start");
  const [pin, setPin] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [movedByHand, setMovedByHand] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [view, setView] = useState<MapView>({ ...THAILAND_VIEW, key: 0 });
  const viewKey = useRef(0);
  // A new key re-centres the map even when the target is unchanged.
  const moveMap = useCallback((lat: number, lng: number, zoom: number) => {
    viewKey.current += 1;
    setView({ lat, lng, zoom, key: viewKey.current });
  }, []);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [canShare, setCanShare] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const lastSearchAt = useRef(0);
  const manualBoxRef = useRef<HTMLTextAreaElement>(null);

  const chatUrl = messengerUrl(page);
  const message = pin ? buildPinMessage(pin.lat, pin.lng) : "";

  useEffect(() => {
    sendEvent("pin_open", page);
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, [page]);

  useEffect(() => {
    if (copyState === "manual") {
      manualBoxRef.current?.focus();
      manualBoxRef.current?.select();
    }
  }, [copyState]);

  /** `denied`: the location was refused or is not available, as opposed to the customer choosing to search. */
  const goManual = useCallback(
    (denied: boolean) => {
      setPhase("manual");
      moveMap(THAILAND_VIEW.lat, THAILAND_VIEW.lng, THAILAND_VIEW.zoom);
      if (denied) sendEvent("pin_locate_denied", page);
    },
    [moveMap, page],
  );

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      goManual(true);
      return;
    }
    setPhase("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        setPin(next);
        setAccuracy(Math.round(position.coords.accuracy));
        setMovedByHand(false);
        setCopyState("idle");
        moveMap(next.lat, next.lng, 18);
        setPhase("located");
        sendEvent("pin_locate_ok", page);
      },
      () => goManual(true),
      GEO_OPTIONS,
    );
  }, [goManual, moveMap, page]);

  useEffect(() => {
    if (isAndroidInAppBrowser(navigator.userAgent)) {
      setChromeUrl(chromeIntentUrl(window.location.origin, page));
    }
  }, [page]);

  // Opened from the Chrome link: ask for the location without another tap.
  const autoLocated = useRef(false);
  useEffect(() => {
    if (!autoLocate || autoLocated.current) return;
    autoLocated.current = true;
    const url = new URL(window.location.href);
    url.searchParams.delete(AUTO_LOCATE_PARAM);
    window.history.replaceState(null, "", url.toString());
    locate();
  }, [autoLocate, locate]);

  const openInChrome = () => sendEvent("pin_open_chrome", page);

  const handlePinChange = useCallback((next: LatLng) => {
    setPin(next);
    setMovedByHand(true);
    setCopyState("idle");
  }, []);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q || searching) return;
    const wait = lastSearchAt.current + NOMINATIM_MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastSearchAt.current = Date.now();
    setSearching(true);
    setSearchError(null);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("countrycodes", "th");
      url.searchParams.set("accept-language", "th");
      url.searchParams.set("limit", "5");
      url.searchParams.set("q", q);
      const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(String(response.status));
      const rows = (await response.json()) as Array<{
        place_id: number;
        display_name: string;
        lat: string;
        lon: string;
      }>;
      const mapped = rows.map((row) => ({
        id: String(row.place_id),
        label: row.display_name,
        lat: Number(row.lat),
        lng: Number(row.lon),
      }));
      setResults(mapped);
      if (mapped.length === 0) setSearchError("ไม่พบชื่อนี้ ลองพิมพ์ชื่อตำบลหรืออำเภอดูนะคะ");
    } catch {
      setResults(null);
      setSearchError("ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง หรือเลื่อนแผนที่หาบ้านเองได้ค่ะ");
    } finally {
      setSearching(false);
    }
  };

  const chooseResult = (result: SearchResult) => {
    moveMap(result.lat, result.lng, 16);
    setPin({ lat: result.lat, lng: result.lng });
    setMovedByHand(true);
    setResults(null);
    setCopyState("idle");
  };

  const handleCopyAndBack = async () => {
    if (!pin) return;
    const ok = await copyText(message);
    if (!ok) {
      setCopyState("manual");
      return;
    }
    setCopyState("copied");
    sendEvent("pin_copy", page);
    sendEvent("pin_back_to_chat", page);
    // Give the analytics beacon a moment, then hand over to Messenger.
    window.setTimeout(() => {
      window.location.href = chatUrl;
    }, 400);
  };

  const handleShare = async () => {
    if (!pin || !navigator.share) return;
    try {
      await navigator.share({ text: message });
    } catch {
      // The customer closed the share sheet.
    }
  };

  const showMap = phase === "located" || phase === "manual";
  const lowAccuracy = phase === "located" && !movedByHand && accuracy !== null && accuracy > LOW_ACCURACY_METERS;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col bg-white text-slate-900">
      <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-base text-white" aria-hidden="true">
          📍
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold" data-testid="pin-brand">
            {page.brand}
          </p>
          <p className="text-xs text-slate-500">ส่งพิกัดบ้านเพื่อเช็กพื้นที่ติดตั้งค่ะ</p>
        </div>
      </header>

      {phase === "start" || phase === "locating" ? (
        <section className="flex flex-1 flex-col justify-center gap-5 px-5 py-8">
          <h1 className="text-2xl font-bold leading-snug">ส่งพิกัดบ้านกลับไปในแชทได้ใน 3 ขั้นค่ะ</h1>
          <ol className="space-y-2 text-lg leading-relaxed text-slate-700">
            <li>1. กดปุ่มแดงด้านล่าง แล้วกด “อนุญาต”</li>
            <li>2. ดูหมุดให้ตรงบ้าน ถ้าไม่ตรง ลากหมุดได้เลยค่ะ</li>
            <li>3. กด “คัดลอกพิกัด แล้วกลับไปแชท” แล้วกดค้างที่ช่องพิมพ์ เลือกวาง จากนั้นกดส่งค่ะ</li>
          </ol>
          {chromeUrl && phase === "start" ? (
            <div className="space-y-2" data-testid="pin-chrome">
              <a
                href={chromeUrl}
                onClick={openInChrome}
                className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-red-600 px-5 text-xl font-bold text-white shadow-lg active:bg-red-700"
              >
                📍 กดเพื่อส่งตำแหน่งบ้าน
              </a>
              <p className="text-center text-base leading-relaxed text-slate-600">
                ระบบจะเปิดแอป Chrome แล้วถามขอใช้ตำแหน่ง ให้กด “อนุญาต” ค่ะ
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={locate}
              disabled={phase === "locating"}
              className="min-h-16 w-full rounded-2xl bg-red-600 px-5 text-xl font-bold text-white shadow-lg active:bg-red-700 disabled:opacity-70"
            >
              {phase === "locating" ? "กำลังหาตำแหน่งค่ะ…" : "📍 ใช้ตำแหน่งปัจจุบัน"}
            </button>
          )}
          <button
            type="button"
            onClick={() => goManual(false)}
            className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base font-semibold text-slate-700"
          >
            ไม่ได้อยู่บ้าน ขอค้นหาเองค่ะ
          </button>
          <p className="text-center text-sm text-slate-500">เราไม่ขอเบอร์ และไม่เก็บพิกัดไว้ในระบบค่ะ</p>
        </section>
      ) : null}

      {showMap ? (
        <section className="flex flex-1 flex-col">
          {phase === "manual" ? (
            <div className="space-y-3 px-4 pt-3" data-testid="pin-manual">
              {chromeUrl ? (
                <a
                  href={chromeUrl}
                  onClick={openInChrome}
                  className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-red-600 px-4 text-lg font-bold text-white shadow-lg active:bg-red-700"
                  data-testid="pin-chrome-manual"
                >
                  📍 เปิด Chrome เพื่อใช้ตำแหน่งบ้าน
                </a>
              ) : null}
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-base leading-relaxed text-amber-900">
                {chromeUrl
                  ? "หรือพิมพ์ชื่อหมู่บ้าน ตำบล อำเภอ แล้วแตะแผนที่ตรงบ้านได้เลยค่ะ"
                  : "ใช้ตำแหน่งไม่ได้ ไม่เป็นไรค่ะ พิมพ์ชื่อหมู่บ้าน ตำบล หรืออำเภอ แล้วแตะแผนที่ตรงบ้านได้เลย"}
                {chromeUrl ? null : (
                  <>
                    <br />
                    ถ้าอยากลองใช้ตำแหน่งอีกครั้ง กด ⋯ มุมขวาบน แล้วเลือกเปิดในเบราว์เซอร์ จากนั้นลองใหม่ค่ะ
                  </>
                )}
                <br />
                ถ้าทำไม่ถนัด กลับไปพิมพ์บอกชื่อหมู่บ้านในแชทได้เลย แอดมินช่วยหาให้ค่ะ
              </div>
              <form onSubmit={handleSearch} className="flex gap-2" role="search">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="เช่น บ้านโนนสูง ต.ขามใหญ่ อ.เมืองอุบลฯ"
                  aria-label="ค้นหาหมู่บ้าน ตำบล หรืออำเภอ"
                  className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-base"
                  enterKeyHint="search"
                />
                <button
                  type="submit"
                  disabled={searching || !query.trim()}
                  className="min-h-12 shrink-0 rounded-xl bg-slate-900 px-4 text-base font-semibold text-white disabled:opacity-50"
                >
                  {searching ? "กำลังหา…" : "ค้นหา"}
                </button>
              </form>
              {searchError ? <p className="text-sm text-red-700">{searchError}</p> : null}
              {results && results.length > 0 ? (
                <ul className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                  {results.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        onClick={() => chooseResult(result)}
                        className="w-full border-b border-slate-100 px-3 py-3 text-left text-sm last:border-b-0 active:bg-slate-100"
                      >
                        {result.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <button type="button" onClick={locate} className="text-sm font-semibold text-red-700 underline underline-offset-2">
                ลองใช้ตำแหน่งปัจจุบันอีกครั้ง
              </button>
            </div>
          ) : null}

          <div className="px-4 pt-3 text-sm" data-testid="pin-status">
            {phase === "located" && !movedByHand && accuracy !== null ? (
              <p className={lowAccuracy ? "font-semibold text-amber-800" : "text-slate-600"}>
                ความแม่นยำประมาณ {accuracy.toLocaleString("th-TH")} เมตร
                {lowAccuracy ? <><br />ตำแหน่งยังไม่ละเอียด ช่วยลากหมุดให้ตรงบ้านนะคะ</> : null}
              </p>
            ) : null}
            {pin && movedByHand ? <p className="text-slate-600">ปักหมุดเองแล้วค่ะ ลากต่อได้ถ้ายังไม่ตรง</p> : null}
            {phase === "located" ? (
              <p className="text-slate-600">ถ้าไม่ได้อยู่บ้าน ลากหมุดไปที่บ้านได้เลยค่ะ</p>
            ) : null}
            {!pin ? <p className="text-slate-600">แตะแผนที่ตรงบ้าน เพื่อปักหมุดค่ะ</p> : null}
          </div>

          <div className="relative isolate mx-4 mt-2 h-[52dvh] min-h-[280px] overflow-hidden rounded-2xl border border-slate-200">
            <PinMap view={view} pin={pin} satellite={satellite} onPinChange={handlePinChange} />
            <button
              type="button"
              onClick={() => setSatellite((value) => !value)}
              className="absolute right-2 top-2 z-[1000] min-h-10 rounded-lg bg-white/95 px-3 text-sm font-semibold text-slate-800 shadow"
            >
              {satellite ? "ดูแผนที่ถนน" : "ดูภาพดาวเทียม"}
            </button>
          </div>

          <div className="sticky bottom-0 z-10 space-y-3 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              onClick={handleCopyAndBack}
              disabled={!pin}
              className="min-h-16 w-full rounded-2xl bg-red-600 px-5 text-lg font-bold text-white shadow-lg active:bg-red-700 disabled:bg-slate-300"
            >
              คัดลอกพิกัด แล้วกลับไปแชท
            </button>
            {canShare && pin ? (
              <button
                type="button"
                onClick={handleShare}
                className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base font-semibold text-slate-700"
              >
                แชร์ผ่านแอปอื่น
              </button>
            ) : null}

            {copyState === "copied" ? (
              <div className="rounded-xl bg-emerald-50 px-3 py-3 text-base leading-relaxed text-emerald-900" role="status" data-testid="pin-copied">
                คัดลอกพิกัดแล้วค่ะ กำลังพากลับไปแชท
                <br />
                กดค้างที่ช่องพิมพ์ แล้วเลือกวาง จากนั้นกดส่งค่ะ
                <br />
                <a href={chatUrl} className="font-semibold underline underline-offset-2" data-testid="pin-chat-link">
                  ถ้ายังไม่กลับไปแชท กดตรงนี้ค่ะ
                </a>
                <br />
                หรือกดปุ่มย้อนกลับของมือถือ ก็จะกลับไปที่แชทค่ะ
              </div>
            ) : null}

            {copyState === "manual" ? (
              <div className="space-y-2 rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-900" data-testid="pin-manual-copy">
                <p>คัดลอกอัตโนมัติไม่ได้ค่ะ กดค้างในกล่องนี้ เลือกทั้งหมด แล้วคัดลอก</p>
                <textarea
                  ref={manualBoxRef}
                  readOnly
                  value={message}
                  rows={3}
                  onFocus={(event) => event.currentTarget.select()}
                  className="w-full rounded-lg border border-amber-300 bg-white p-2 text-base text-slate-900"
                  aria-label="ข้อความพิกัดสำหรับคัดลอก"
                />
                <a
                  href={chatUrl}
                  onClick={() => sendEvent("pin_back_to_chat", page)}
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-base font-semibold text-white"
                  data-testid="pin-chat-link"
                >
                  คัดลอกแล้ว กลับไปแชท
                </a>
                <p>จากนั้นกดค้างที่ช่องพิมพ์ แล้วเลือกวาง แล้วกดส่งค่ะ</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
