"use client";

import type { WidgetOffer } from "@/lib/publisher-types";
import type { ClickPlacement } from "@/lib/types";
import {
  offerCta,
  offerDescription,
  offerTitle,
  WIDGET_COPY,
} from "@/lib/widget-offer-display";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronRight,
  Clock,
  Lock,
  Shield,
  X,
} from "lucide-react";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80";

function OfferMedia({
  offer,
  className,
}: {
  offer: WidgetOffer;
  className?: string;
}) {
  const url = offer.media_url || FALLBACK_IMAGE;
  return (
    <div className={cn("shrink-0 overflow-hidden bg-zinc-100", className)}>
      {offer.media_type === "video" ? (
        <video
          src={url}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
      )}
    </div>
  );
}

function CheckBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white",
        className
      )}
    >
      <Check className="h-5 w-5 stroke-[2.5]" />
    </span>
  );
}

function RedirectOfferRow({
  offer,
  clickHref,
  recommended,
}: {
  offer: WidgetOffer;
  clickHref: string;
  recommended?: boolean;
}) {
  const desc = offerDescription(offer);
  const cta = offerCta(offer, "redirect");

  return (
    <a
      href={clickHref}
      rel="noopener sponsored"
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] sm:flex-row sm:items-stretch"
    >
      <OfferMedia offer={offer} className="aspect-[16/9] w-full sm:aspect-auto sm:h-auto sm:w-[148px] sm:min-h-[108px]" />
      <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3.5 sm:px-5">
        {recommended ? (
          <span className="mb-1 inline-flex w-fit rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            {WIDGET_COPY.redirect.recommended}
          </span>
        ) : null}
        <h3 className="text-[15px] font-semibold leading-snug text-zinc-900 sm:text-base">
          {offerTitle(offer)}
        </h3>
        {desc ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
            {desc}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center px-4 pb-3.5 sm:px-4 sm:py-0">
        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#5B47FB] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors group-hover:bg-[#4f3fe0] sm:w-auto">
          {cta}
          <span aria-hidden>→</span>
        </span>
      </div>
    </a>
  );
}

function PopupOfferRow({
  offer,
  clickHref,
}: {
  offer: WidgetOffer;
  clickHref: string;
}) {
  const desc = offerDescription(offer);

  return (
    <a
      href={clickHref}
      rel="noopener sponsored"
      className="group flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-3 transition-colors hover:border-zinc-200 hover:bg-zinc-50/80"
    >
      <OfferMedia offer={offer} className="h-14 w-14 rounded-lg" />
      <div className="min-w-0 flex-1">
        <h3 className="text-[14px] font-semibold text-zinc-900">
          {offerTitle(offer)}
        </h3>
        {desc ? (
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-zinc-500">
            {desc}
          </p>
        ) : null}
      </div>
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5B47FB] text-white transition-colors group-hover:bg-[#4f3fe0]">
        <ChevronRight className="h-5 w-5" />
      </span>
    </a>
  );
}

function NativeOfferRow({
  offer,
  clickHref,
}: {
  offer: WidgetOffer;
  clickHref: string;
}) {
  const desc = offerDescription(offer);

  return (
    <a
      href={clickHref}
      rel="noopener sponsored"
      className="group flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-3 py-3 transition-colors hover:border-zinc-200"
    >
      <OfferMedia offer={offer} className="h-12 w-12 rounded-lg" />
      <div className="min-w-0 flex-1">
        <h3 className="text-[14px] font-semibold text-zinc-900">
          {offerTitle(offer)}
        </h3>
        {desc ? (
          <p className="mt-0.5 line-clamp-2 text-[12px] text-zinc-500">{desc}</p>
        ) : null}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition-colors group-hover:text-[#5B47FB]" />
    </a>
  );
}

function NativeTrustSection() {
  const icons = [Shield, Clock, Lock] as const;
  return (
    <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-4">
      <p className="text-center text-[13px] font-semibold text-zinc-800">
        {WIDGET_COPY.native.trustHeading}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {WIDGET_COPY.native.trust.map((item, i) => {
          const Icon = icons[i];
          return (
            <div key={item.title} className="px-1">
              <Icon className="mx-auto h-5 w-5 text-[#5B47FB]" strokeWidth={1.75} />
              <p className="mt-2 text-[11px] font-semibold text-zinc-800">
                {item.title}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
                {item.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WidgetOffersView({
  offers,
  placement,
  getClickHref,
  onDismiss,
  cardsOnly = false,
  className,
}: {
  offers: WidgetOffer[];
  placement: ClickPlacement;
  getClickHref: (offer: WidgetOffer) => string;
  onDismiss?: () => void;
  /** Native iframe: only offer rows, no thank-you header or trust block */
  cardsOnly?: boolean;
  className?: string;
}) {
  const count = offers.length;

  if (cardsOnly && placement === "redirect") {
    return (
      <div className={cn("mx-auto w-full max-w-2xl space-y-3 sm:space-y-4", className)}>
        {offers.map((offer, i) => (
          <RedirectOfferRow
            key={`${offer.campaign_id}-${offer.ad_id}`}
            offer={offer}
            clickHref={getClickHref(offer)}
            recommended={i === 0}
          />
        ))}
      </div>
    );
  }

  if (cardsOnly && placement === "popup") {
    return (
      <div className={cn("w-full max-w-md space-y-2", className)}>
        {offers.map((offer) => (
          <PopupOfferRow
            key={`${offer.campaign_id}-${offer.ad_id}`}
            offer={offer}
            clickHref={getClickHref(offer)}
          />
        ))}
      </div>
    );
  }

  if (cardsOnly && placement === "native") {
    return (
      <div className={cn("w-full max-w-md space-y-2", className)}>
        {offers.map((offer) => (
          <NativeOfferRow
            key={`${offer.campaign_id}-${offer.ad_id}`}
            offer={offer}
            clickHref={getClickHref(offer)}
          />
        ))}
      </div>
    );
  }

  if (placement === "redirect") {
    return (
      <div className={cn("mx-auto w-full max-w-2xl", className)}>
        <header className="mb-8 text-center">
          <CheckBadge className="mx-auto h-11 w-11" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900 sm:text-[22px]">
            {WIDGET_COPY.redirect.title(count)}
          </h1>
          <p className="mt-2 text-[14px] text-zinc-500">
            {WIDGET_COPY.redirect.subtitle}
          </p>
        </header>
        <div className="space-y-3 sm:space-y-4">
          {offers.map((offer, i) => (
            <RedirectOfferRow
              key={`${offer.campaign_id}-${offer.ad_id}`}
              offer={offer}
              clickHref={getClickHref(offer)}
              recommended={i === 0}
            />
          ))}
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-center text-[12px] text-zinc-400">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          {WIDGET_COPY.redirect.trust}
        </p>
      </div>
    );
  }

  if (placement === "popup") {
    const body = (
      <div className="relative w-full max-w-[400px] rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Sluiten"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <header className="mb-4 flex items-start gap-3 pr-8">
          <CheckBadge className="h-8 w-8 shrink-0" />
          <h2 className="text-[15px] font-semibold leading-snug text-zinc-900">
            {WIDGET_COPY.popup.title(count)}
          </h2>
        </header>
        <div className="space-y-2">
          {offers.map((offer) => (
            <PopupOfferRow
              key={`${offer.campaign_id}-${offer.ad_id}`}
              offer={offer}
              clickHref={getClickHref(offer)}
            />
          ))}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-4 w-full text-center text-[13px] font-medium text-zinc-400 hover:text-zinc-600"
          >
            {WIDGET_COPY.popup.dismiss}
          </button>
        ) : null}
      </div>
    );

    if (onDismiss) {
      return (
        <div
          className={cn(
            "relative flex min-h-[320px] items-center justify-center rounded-xl bg-zinc-900/50 p-4",
            className
          )}
        >
          <div className="relative">{body}</div>
        </div>
      );
    }

    return <div className={cn("relative", className)}>{body}</div>;
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      {!cardsOnly ? (
        <header className="mb-4 flex items-center gap-2.5">
          <CheckBadge className="h-8 w-8 shrink-0" />
          <h2 className="text-[16px] font-semibold text-zinc-900">
            {WIDGET_COPY.native.title}
          </h2>
        </header>
      ) : null}
      <div className="space-y-2">
        {offers.map((offer) => (
          <NativeOfferRow
            key={`${offer.campaign_id}-${offer.ad_id}`}
            offer={offer}
            clickHref={getClickHref(offer)}
          />
        ))}
      </div>
      {!cardsOnly ? <NativeTrustSection /> : null}
    </div>
  );
}
