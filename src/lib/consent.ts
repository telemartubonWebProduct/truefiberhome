/* ------------------------------------------------------------------ */
/*  Cookie consent (PDPA)                                              */
/*                                                                     */
/*  "true" in localStorage under CONSENT_KEY = the visitor accepted    */
/*  analytics and advertising cookies (Google Analytics, GTM and the   */
/*  Meta Pixel). The key moved to v3 when the Meta Pixel was added, so */
/*  everyone is asked again with the new wording.                      */
/* ------------------------------------------------------------------ */

export const CONSENT_KEY = "cookie-consent-accepted-v3";

/** Dispatched on window when the visitor accepts. */
export const CONSENT_EVENT = "cookie-consent-accepted";
