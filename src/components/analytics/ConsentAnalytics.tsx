"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { CONSENT_EVENT, CONSENT_KEY } from "@/src/lib/consent";
import { META_PIXEL_ID, metaPixelSnippet } from "@/src/lib/meta-pixel";

export default function ConsentAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const syncConsent = () => {
      setEnabled(window.localStorage.getItem(CONSENT_KEY) === "true");
    };
    syncConsent();
    window.addEventListener(CONSENT_EVENT, syncConsent);
    return () =>
      window.removeEventListener(CONSENT_EVENT, syncConsent);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        id="google-analytics-loader"
        src="https://www.googletagmanager.com/gtag/js?id=G-0X5TY75CH1"
        strategy="lazyOnload"
      />
      <Script
        id="google-analytics-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('consent', 'update', {
              ad_storage: 'granted',
              analytics_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'granted'
            });
            gtag('config', 'G-0X5TY75CH1', {
              anonymize_ip: true,
              send_page_view: true
            });
          `,
        }}
      />
      <Script
        id="google-tag-manager"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M82FD3NC');`,
        }}
      />
      {/* Meta Pixel: PageView here (and on client-side navigation, by fbevents.js itself); clicks in src/lib/track-event.ts. */}
      {META_PIXEL_ID ? (
        <Script
          id="meta-pixel"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{ __html: metaPixelSnippet(META_PIXEL_ID) }}
        />
      ) : null}
    </>
  );
}
