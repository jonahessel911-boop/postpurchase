import type { ClickPlacement } from "@/lib/types";

/** Base path for click tracking (records click → redirects to advertiser). */
export function getClickApiBase(): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/+$/, "");
    if (origin && !/^https?:\/\/localhost(\b|:)/i.test(origin)) {
      return `${origin}/api/click`;
    }
  }
  return `${getPublisherPlatformOrigin()}/api/click`;
}

export function normalizeSiteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
  return `https://${trimmed.replace(/\/+$/, "")}`;
}

export function normalizePagePath(path: string): string {
  const trimmed = path.trim() || "/confirmation";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** Full page URL stored on clicks as widget_url. */
export function buildWidgetPageUrl(siteUrl: string, pagePath: string): string {
  const base = normalizeSiteUrl(siteUrl);
  const path = normalizePagePath(pagePath);
  if (!base) return path;
  try {
    return new URL(path, `${base}/`).toString().replace(/\/$/, "");
  } catch {
    return `${base}${path}`;
  }
}

export function buildWidgetClickUrl(
  campaignId: string,
  options: {
    widgetUrl: string;
    publisherId: string;
    intentProduct: string;
    productChoose: string;
    productSelection: string[];
    placement: ClickPlacement;
    geoCountry?: string | null;
    adId: string;
  }
): string {
  const url = new URL(`${getClickApiBase()}/${campaignId}`);
  url.searchParams.set("widget_url", options.widgetUrl);
  url.searchParams.set("publisher_id", options.publisherId);
  if (options.intentProduct) {
    url.searchParams.set("intent_product", options.intentProduct);
  }
  url.searchParams.set("product_choose", options.productChoose);
  if (options.productSelection.length) {
    url.searchParams.set(
      "product_selection",
      JSON.stringify(options.productSelection)
    );
  }
  url.searchParams.set("placement", options.placement);
  url.searchParams.set("ad_id", options.adId);
  if (options.geoCountry) {
    url.searchParams.set("geo", options.geoCountry);
  }
  return url.toString();
}

/** Live publisher platform (embeds, redirects, widget iframes). */
export const PUBLISHER_PLATFORM_ORIGIN = "https://platform.relyo.nl";

export function getAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}

/**
 * Origin shown in publisher install codes (redirect, popup, native).
 * Always the public platform URL — never localhost, even in local dev.
 */
export function getPublisherPlatformOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (fromEnv && !/^https?:\/\/localhost(\b|:)/i.test(fromEnv)) {
    return fromEnv;
  }
  return PUBLISHER_PLATFORM_ORIGIN;
}

/** @alias getPublisherPlatformOrigin */
export function getResourcesExampleOrigin(): string {
  return getPublisherPlatformOrigin();
}
