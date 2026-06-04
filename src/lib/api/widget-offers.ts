import type { WidgetOffer, WidgetOffersResponse } from "@/lib/publisher-types";
import { sanitizeOfferText } from "@/lib/widget-offer-display";
import type { ClickPlacement } from "@/lib/types";
import { pickAdForTraffic } from "@/lib/ads";
import {
  buildWidgetClickUrl,
  getPublisherPlatformOrigin,
} from "@/lib/widget-url";
import { getServiceClient } from "@/lib/supabase/service";
import type { Ad } from "@/lib/types";
import { normalizePlacement } from "@/lib/click-attribution";

const DEFAULT_MAX_OFFERS = 3;

export interface LoadWidgetOffersOptions {
  preview?: boolean;
  format?: ClickPlacement;
  widgetUrl?: string | null;
  intentProduct?: string | null;
  geoCountry?: string | null;
}

export async function loadWidgetOffersByPublisher(
  publisherId: string,
  options?: LoadWidgetOffersOptions
): Promise<WidgetOffersResponse | null> {
  const supabase = getServiceClient();

  const { data: publisher, error: publisherError } = await supabase
    .from("publishers")
    .select("id, status")
    .eq("id", publisherId)
    .maybeSingle();

  if (publisherError || !publisher) return null;
  if (!options?.preview && publisher.status !== "active") return null;

  const format = options?.format ?? "native";
  const maxOffers = DEFAULT_MAX_OFFERS;
  const today = new Date().toISOString().split("T")[0];

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, name, on_off, status, start_date, end_date, ads(*)")
    .eq("on_off", true)
    .neq("status", "rejected");

  if (campaignsError || !campaigns?.length) {
    const empty = buildEmptyResponse(publisherId, format, options);
    void recordOfferImpression(supabase, publisherId, 0);
    return empty;
  }

  type CampaignRow = {
    id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    ads: Ad[];
  };

  const offers: WidgetOffer[] = [];

  for (const raw of campaigns as CampaignRow[]) {
    if (offers.length >= maxOffers) break;
    if (raw.start_date && raw.start_date > today) continue;
    if (raw.end_date && raw.end_date < today) continue;

    const activeAds = (raw.ads ?? []).filter(
      (a) => a.active && !(a.is_draft ?? false)
    );
    if (!activeAds.length) continue;

    const ad = pickAdForTraffic(activeAds);
    if (!ad) continue;

    const productLabel = [raw.name, ad.title || ad.name].filter(Boolean).join(" · ");

    offers.push({
      campaign_id: raw.id,
      ad_id: ad.id,
      title: sanitizeOfferText(ad.title || ad.name),
      subheadline: sanitizeOfferText(ad.subheadline || ""),
      media_url: ad.media_url,
      media_type: ad.media_type,
      cta_text: ad.cta_text || "Learn more",
      product_label: productLabel,
    });
  }

  for (let i = offers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [offers[i], offers[j]] = [offers[j], offers[i]];
  }

  const payload: WidgetOffersResponse = {
    publisher_id: publisherId,
    placement_id: publisherId,
    placement: format,
    page: extractPageFromWidgetUrl(options?.widgetUrl),
    intent_product: options?.intentProduct?.trim() ?? "",
    api_domain: `${getPublisherPlatformOrigin()}/api`,
    offers: offers.slice(0, maxOffers),
  };

  void recordOfferImpression(supabase, publisherId, payload.offers.length);

  return payload;
}

/** @deprecated Use publisher_id — resolves placement row to publisher_id. */
export async function loadWidgetOffers(
  placementOrPartnerId: string,
  options?: LoadWidgetOffersOptions
): Promise<WidgetOffersResponse | null> {
  const supabase = getServiceClient();

  const { data: placementRow } = await supabase
    .from("publisher_placements")
    .select("publisher_id, placement, intent_product, geo_country, page_path, site_url")
    .eq("id", placementOrPartnerId)
    .maybeSingle();

  const publisherId = placementRow?.publisher_id ?? placementOrPartnerId;
  const format = placementRow?.placement
    ? normalizePlacement(String(placementRow.placement))
    : options?.format;

  return loadWidgetOffersByPublisher(publisherId, {
    ...options,
    format: format ?? options?.format ?? "native",
    intentProduct:
      options?.intentProduct ??
      (placementRow?.intent_product as string | undefined),
    geoCountry:
      options?.geoCountry ?? (placementRow?.geo_country as string | null),
  });
}

function extractPageFromWidgetUrl(widgetUrl?: string | null): string {
  if (!widgetUrl?.trim()) return "";
  try {
    const u = new URL(widgetUrl);
    return u.pathname.replace(/^\//, "") || "";
  } catch {
    return widgetUrl.replace(/^\//, "");
  }
}

async function recordOfferImpression(
  supabase: ReturnType<typeof getServiceClient>,
  publisherId: string,
  offerCount: number
) {
  const { error } = await supabase.from("publisher_offer_impressions").insert({
    placement_id: null,
    publisher_id: publisherId,
    offer_count: offerCount,
  });
  void error;
}

function buildEmptyResponse(
  publisherId: string,
  format: ClickPlacement,
  options?: LoadWidgetOffersOptions
): WidgetOffersResponse {
  return {
    publisher_id: publisherId,
    placement_id: publisherId,
    placement: format,
    page: extractPageFromWidgetUrl(options?.widgetUrl),
    intent_product: options?.intentProduct?.trim() ?? "",
    api_domain: `${getPublisherPlatformOrigin()}/api`,
    offers: [],
  };
}

/** Traffic partner id or legacy placement row id → publisher id. */
export async function resolvePublisherIdForWidget(
  placementOrPartnerId: string
): Promise<string | null> {
  const supabase = getServiceClient();
  const id = placementOrPartnerId.trim();
  if (!id) return null;

  const { data: publisher } = await supabase
    .from("publishers")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (publisher?.id) return publisher.id as string;

  const { data: placement } = await supabase
    .from("publisher_placements")
    .select("publisher_id")
    .eq("id", id)
    .maybeSingle();
  return (placement?.publisher_id as string) ?? null;
}

export async function getPublisherForWidget(
  placementOrPartnerId: string,
  options?: { preview?: boolean }
): Promise<{ id: string; company_name: string } | null> {
  const publisherId = await resolvePublisherIdForWidget(placementOrPartnerId);
  if (!publisherId) return null;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("publishers")
    .select("id, company_name, status")
    .eq("id", publisherId)
    .maybeSingle();

  if (error || !data) return null;
  if (!options?.preview && data.status !== "active") return null;
  return {
    id: data.id as string,
    company_name: data.company_name as string,
  };
}

/** @deprecated */
export async function getPlacementForWidget(placementId: string) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("publisher_placements")
    .select("publisher_id")
    .eq("id", placementId)
    .maybeSingle();
  if (!data?.publisher_id) return null;
  return getPublisherForWidget(data.publisher_id as string);
}

export function buildOfferClickUrl(
  publisherId: string,
  format: ClickPlacement,
  offer: WidgetOffer,
  allOffers: WidgetOffer[],
  options?: {
    widgetUrl?: string;
    intentProduct?: string;
    geoCountry?: string | null;
  }
): string {
  return buildWidgetClickUrl(offer.campaign_id, {
    widgetUrl: options?.widgetUrl || "",
    publisherId,
    intentProduct: options?.intentProduct ?? "",
    productChoose: offer.product_label,
    productSelection: allOffers.map((o) => o.product_label),
    placement: format,
    geoCountry: options?.geoCountry,
    adId: offer.ad_id,
  });
}
