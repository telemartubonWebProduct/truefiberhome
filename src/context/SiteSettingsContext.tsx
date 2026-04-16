"use client";

import React, { createContext, useContext } from "react";
import { lineSupport } from "@/src/context/line-path";

const legacyLineSupportUrl = "https://lin.ee/DprkCdo";

function normalizeLineSupportUrl(value?: string | null) {
  const next = typeof value === "string" ? value.trim() : "";

  if (!next || next === "/service" || next === "#" || next === legacyLineSupportUrl) {
    return lineSupport;
  }

  return next;
}

interface SiteSettingsType {
  lineSupportUrl: string;
}

const SiteSettingsContext = createContext<SiteSettingsType>({
  lineSupportUrl: lineSupport,
});

export const SiteSettingsProvider = ({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: Partial<SiteSettingsType>;
}) => {
  return (
    <SiteSettingsContext.Provider
      value={{
        lineSupportUrl: normalizeLineSupportUrl(settings.lineSupportUrl),
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);