import type { ClickPlacement } from "@/lib/types";
import type { WidgetOffer } from "@/lib/publisher-types";

/** Strip pricing-model labels from copy shown to end users. */
export function sanitizeOfferText(text: string): string {
  return text
    .replace(/\s*[-–—•|]?\s*cpc\s*model\s*/gi, " ")
    .replace(/\bcpc\s*model\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function offerTitle(offer: WidgetOffer): string {
  return sanitizeOfferText(offer.title);
}

export function offerDescription(offer: WidgetOffer): string {
  return sanitizeOfferText(offer.subheadline || "");
}

/** Opens advertiser destination in a new tab (required inside iframe embeds). */
export const OFFER_LINK_REL = "noopener noreferrer sponsored";
export const OFFER_LINK_TARGET = "_blank";

export function offerCta(
  offer: WidgetOffer,
  placement: ClickPlacement
): string {
  const raw = sanitizeOfferText(offer.cta_text || "");
  if (placement === "popup") return "";
  if (raw && !/^learn more$/i.test(raw)) return raw;
  return placement === "redirect" ? "Bekijk aanbod" : "";
}

export const WIDGET_COPY = {
  redirect: {
    title: (n: number) =>
      `Bedankt! We hebben ${n} relevante aanbiedingen voor je gevonden`,
    subtitle: "Kies de aanbieding die het beste bij jou past.",
    recommended: "Aanbevolen",
    trust:
      "100% onafhankelijk · Vrijblijvend vergelijken · Geen verplichtingen",
  },
  popup: {
    title: (n: number) =>
      `${n} relevante aanbiedingen voor jou gevonden`,
    dismiss: "Nee, bedankt",
  },
  native: {
    title: "Bedankt voor je aanvraag!",
    trustHeading: "Waarom via ons?",
    trust: [
      {
        title: "Onafhankelijk",
        body: "Wij werken met betrouwbare partners",
      },
      {
        title: "Snel & eenvoudig",
        body: "Beste opties binnen 1 minuut",
      },
      {
        title: "Vrijblijvend",
        body: "Je zit nergens aan vast",
      },
    ],
  },
} as const;
