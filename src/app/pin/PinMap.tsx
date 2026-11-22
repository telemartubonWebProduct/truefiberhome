"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type LatLng = { lat: number; lng: number };

type PinMapProps = {
  /** Where the map looks. Changing it re-centres the map. */
  view: { lat: number; lng: number; zoom: number; key: number };
  /** Current pin, or null when the customer has not placed one yet. */
  pin: LatLng | null;
  satellite: boolean;
  /** Called when the customer drags the pin or taps the map. */
  onPinChange: (next: LatLng) => void;
};

const STREET_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const STREET_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
const SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTRIBUTION =
  "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";

// Inline SVG pin, so no marker image has to be bundled or fetched.
const PIN_ICON = L.divIcon({
  className: "pin-marker",
  html:
    '<svg width="40" height="52" viewBox="0 0 40 52" aria-hidden="true">' +
    '<path d="M20 51C20 51 38 31.5 38 19A18 18 0 0 0 2 19C2 31.5 20 51 20 51Z" fill="#e3001b" stroke="#fff" stroke-width="3"/>' +
    '<circle cx="20" cy="19" r="7" fill="#fff"/></svg>',
  iconSize: [40, 52],
  iconAnchor: [20, 51],
});

export default function PinMap({ view, pin, satellite, onPinChange }: PinMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const layersRef = useRef<{ street: L.TileLayer; satellite: L.LayerGroup } | null>(null);
  const onPinChangeRef = useRef(onPinChange);

  useEffect(() => {
    onPinChangeRef.current = onPinChange;
  }, [onPinChange]);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [view.lat, view.lng],
      zoom: view.zoom,
      zoomControl: true,
      attributionControl: true,
    });
    map.attributionControl.setPrefix(false);

    const street = L.tileLayer(STREET_URL, { maxZoom: 19, attribution: STREET_ATTRIBUTION });
    const satelliteGroup = L.layerGroup([
      L.tileLayer(SATELLITE_URL, { maxZoom: 19, maxNativeZoom: 18, attribution: SATELLITE_ATTRIBUTION }),
      L.tileLayer(LABELS_URL, { maxZoom: 19, maxNativeZoom: 18 }),
    ]);
    layersRef.current = { street, satellite: satelliteGroup };
    street.addTo(map);

    // Tapping the map moves the pin there: easier than dragging on a small screen.
    map.on("click", (event: L.LeafletMouseEvent) => {
      onPinChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      layersRef.current = null;
    };
    // The initial view only; later views are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setView([view.lat, view.lng], view.zoom);
  }, [view.lat, view.lng, view.zoom, view.key]);

  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;
    if (satellite) {
      map.removeLayer(layers.street);
      layers.satellite.addTo(map);
    } else {
      map.removeLayer(layers.satellite);
      layers.street.addTo(map);
    }
  }, [satellite]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!pin) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const marker = L.marker([pin.lat, pin.lng], {
        draggable: true,
        autoPan: true,
        icon: PIN_ICON,
        keyboard: true,
        title: "หมุดบ้าน",
        alt: "หมุดบ้าน",
      });
      marker.on("dragend", () => {
        const next = marker.getLatLng();
        onPinChangeRef.current({ lat: next.lat, lng: next.lng });
      });
      marker.addTo(map);
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([pin.lat, pin.lng]);
    }
  }, [pin]);

  return <div ref={containerRef} className="h-full w-full" data-testid="pin-map" />;
}
