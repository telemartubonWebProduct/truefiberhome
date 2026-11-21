"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type Pin = { latitude: number; longitude: number };

// Bangkok, zoomed out far enough to show most of the country.
const START: [number, number] = [13.7563, 100.5018];

/**
 * Map with a fixed pin in the middle: the visitor moves the map under it.
 * `onChange` only fires after the visitor has moved the map or used their
 * location, so an untouched map never counts as a chosen place.
 */
export default function LeadMap({ onChange }: { onChange: (pin: Pin) => void }) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const report = useRef(onChange);
  const [status, setStatus] = useState<"idle" | "locating" | "denied">("idle");

  useEffect(() => {
    report.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!holder.current || map.current) return;
    const instance = L.map(holder.current, { center: START, zoom: 6, zoomControl: true, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(instance);

    let touched = false;
    const touch = () => {
      touched = true;
    };
    instance.on("dragstart zoomstart", touch);
    instance.on("moveend", () => {
      if (!touched) return;
      const center = instance.getCenter();
      report.current({ latitude: center.lat, longitude: center.lng });
    });
    instance.on("locationfound", (event) => {
      touched = true;
      instance.setView(event.latlng, 17);
      setStatus("idle");
    });
    instance.on("locationerror", () => setStatus("denied"));

    map.current = instance;
    // The dialog animates open; the map needs its final size.
    const timer = window.setTimeout(() => instance.invalidateSize(), 250);
    return () => {
      window.clearTimeout(timer);
      instance.remove();
      map.current = null;
    };
  }, []);

  const locate = () => {
    if (!map.current) return;
    setStatus("locating");
    map.current.locate({ enableHighAccuracy: true, timeout: 10000 });
  };

  return (
    <div className="lf-map">
      <div className="lf-map-canvas" ref={holder} />
      <span className="lf-map-pin" aria-hidden="true" />
      <button type="button" className="lf-map-locate" onClick={locate} disabled={status === "locating"}>
        {status === "locating" ? "กำลังหาตำแหน่ง" : "ใช้ตำแหน่งของฉัน"}
      </button>
      {status === "denied" && (
        <p className="lf-map-note" role="status">
          หาตำแหน่งไม่ได้ ลองเลื่อนแผนที่ไปยังบ้านของคุณ หรือพิมพ์ที่อยู่ด้านล่างแทน
        </p>
      )}
    </div>
  );
}
