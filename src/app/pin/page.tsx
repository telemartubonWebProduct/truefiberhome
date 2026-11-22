import type { Metadata } from "next";
import { AUTO_LOCATE_PARAM, resolvePinPage } from "@/src/lib/pin";
import PinClient from "./PinClient";

type PinPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const NO_INDEX: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
};

export async function generateMetadata({ searchParams }: PinPageProps): Promise<Metadata> {
  const page = resolvePinPage((await searchParams).p);
  const title = `ส่งพิกัดบ้าน | ${page.brand}`;
  const description = "กดใช้ตำแหน่งปัจจุบัน แล้วส่งพิกัดบ้านกลับไปในแชทได้เลยค่ะ";

  return {
    // absolute: the site-wide title template carries another brand name.
    title: { absolute: title },
    description,
    robots: NO_INDEX,
    alternates: { canonical: null },
    // The link preview in Messenger reads these.
    openGraph: { title, description, siteName: page.brand, locale: "th_TH", type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PinPage({ searchParams }: PinPageProps) {
  const params = await searchParams;
  const page = resolvePinPage(params.p);
  // Set by the "open in Chrome" link: ask for the location straight away.
  const autoLocate = params[AUTO_LOCATE_PARAM] === "1";
  return <PinClient page={page} autoLocate={autoLocate} />;
}
