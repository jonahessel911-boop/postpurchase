import type { WidgetOffer, WidgetOffersResponse } from "@/lib/publisher-types";
import { sanitizeOfferText } from "@/lib/widget-offer-display";
import { placementWidgetPageUrl } from "@/lib/api/publisher-placements";
import type { PublisherPlacement } from "@/lib/publisher-types";
import { pickAdForTraffic } from "@/lib/ads";
import { buildWidgetClickUrl, getApiDomain } from "@/lib/widget-url";
import { getServiceClient } from "@/lib/supabase/service";
import type { Ad } from "@/lib/types";

function mapPlacement(row: Record<string, unknown>): PublisherPlacement {
  return {
    id: row.id as string,
    publisher_id: row.publisher_id as string,
    name: row.name as string,
    site_url: (row.site_url as string) ?? "",
    page_path: (row.page_path as string) ?? "/confirmation",
    intent_product: (row.intent_product as string) ?? "",
    placement: row.placement as PublisherPlacement["placement"],
    geo_country: (row.geo_country as string | null) ?? null,
    max_offers: Number(row.max_offers ?? 3),
    active: Boolean(row.active),
    submit_element_id: (row.submit_element_id as string | null) ?? null,
    post_submit_redirect_url:
      (row.post_submit_redirect_url as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function loadWidgetOffers(
  placementId: string,
  options?: { preview?: boolean }
): Promise<WidgetOffersResponse | null> {
  const supabase = getServiceClient();

  let placementQuery = supabase
    .from("publisher_placements")
    .select("*")
    .eq("id", placementId);

  if (!options?.preview) {
    placementQuery = placementQuery.eq("active", true);
  }

  const { data: placementRow, error: placementError } =
    await placementQuery.maybeSingle();

  if (placementError || !placementRow) return null;

  const placement = mapPlacement(placementRow);

  const { data: publisher } = await supabase
    .from("publishers")
    .select("status")
    .eq("id", placement.publisher_id)
    .maybeSingle();

  if (!publisher || publisher.status !== "active") return null;

  const today = new Date().toISOString().split("T")[0];

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, name, on_off, status, start_date, end_date, ads(*)")
    .eq("on_off", true)
    .neq("status", "rejected");

  if (campaignsError || !campaigns?.length) {
    const empty = emptyResponse(placement);
    void recordOfferImpression(
      supabase,
      placement.id,
      placement.publisher_id,
      0
    );
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
    if (offers.length >= placement.max_offers) break;
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

  // Shuffle so partners don't always show the same order
  for (let i = offers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [offers[i], offers[j]] = [offers[j], offers[i]];
  }

  const payload = {
    placement_id: placement.id,
    publisher_id: placement.publisher_id,
    page: placement.page_path.replace(/^\//, ""),
    intent_product: placement.intent_product,
    placement: placement.placement,
    api_domain: getApiDomain(),
    offers: offers.slice(0, placement.max_offers),
  };

  void recordOfferImpression(
    supabase,
    placement.id,
    placement.publisher_id,
    payload.offers.length
  );

  return payload;
}

async function recordOfferImpression(
  supabase: ReturnType<typeof getServiceClient>,
  placementId: string,
  publisherId: string,
  offerCount: number
) {
  const { error } = await supabase.from("publisher_offer_impressions").insert({
    placement_id: placementId,
    publisher_id: publisherId,
    offer_count: offerCount,
  });
  void error;
}

function emptyResponse(placement: PublisherPlacement): WidgetOffersResponse {
  return {
    placement_id: placement.id,
    publisher_id: placement.publisher_id,
    page: placement.page_path.replace(/^\//, ""),
    intent_product: placement.intent_product,
    placement: placement.placement,
    api_domain: getApiDomain(),
    offers: [],
  };
}

export async function getPlacementForWidget(
  placementId: string
): Promise<PublisherPlacement | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("publisher_placements")
    .select("*")
    .eq("id", placementId)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return mapPlacement(data);
}

export function buildOfferClickUrl(
  placement: PublisherPlacement,
  offer: WidgetOffer,
  allOffers: WidgetOffer[],
  widgetUrlOverride?: string
): string {
  const widgetUrl =
    widgetUrlOverride || placementWidgetPageUrl(placement) || "";

  return buildWidgetClickUrl(offer.campaign_id, {
    widgetUrl,
    publisherId: placement.publisher_id,
    intentProduct: placement.intent_product,
    productChoose: offer.product_label,
    productSelection: allOffers.map((o) => o.product_label),
    placement: placement.placement,
    geoCountry: placement.geo_country,
    adId: offer.ad_id,
  });
}
