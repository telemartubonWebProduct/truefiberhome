import { lineSupport } from "@/src/context/line-path";
import { safeLink } from "@/src/lib/api-normalize";
import TrackedLineLink from "./TrackedLineLink";

interface InstallPromotionContent {
  title: string;
  topLine: string;
  priceText: string;
  bottomLine: string;
  primaryButtonLabel: string;
  primaryButtonHref: string;
  secondaryButtonLabel: string;
  secondaryButtonHref: string;
  footerText: string;
  isActive: boolean;
}

interface InstallPromotionProps {
  content: InstallPromotionContent;
}

const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-[#ffca28] px-6 py-3 text-base font-bold text-[#1a1a1a] shadow-[0_4px_14px_rgba(255,202,40,0.35)] transition-colors hover:bg-[#ffb300] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:px-8";

export default function InstallPromotion({ content }: InstallPromotionProps) {
  if (!content.isActive) return null;

  const primaryButtonHref =
    safeLink(content.primaryButtonHref) || lineSupport;
  const secondaryButtonHref =
    safeLink(content.secondaryButtonHref) || "/boardband";

  return (
    <section className="relative flex min-h-[280px] flex-1 flex-col items-center justify-center overflow-hidden rounded-xl bg-[#d9252a] p-7 text-center text-white shadow-[0_12px_36px_rgba(183,28,28,0.22)] md:p-9">
      <h2 className="whitespace-pre-line text-3xl font-bold leading-tight text-white md:text-4xl">
        {content.title}
      </h2>

      <p className="mt-4 text-base leading-7 text-white md:text-lg">
        {content.topLine}{" "}
        <strong className="text-[#ffca28]">{content.priceText}</strong>
        <br />
        {content.bottomLine}
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <TrackedLineLink
          href={primaryButtonHref}
          source="home_install_promo"
          className={primaryButtonClass}
        >
          {content.primaryButtonLabel}
        </TrackedLineLink>

        <a
          href={secondaryButtonHref}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/70 bg-transparent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:px-8"
        >
          {content.secondaryButtonLabel}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </a>
      </div>

      <p className="mt-7 text-sm leading-6 text-white/80">
        {content.footerText}
      </p>
    </section>
  );
}
