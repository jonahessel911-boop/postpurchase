import {
  parseClickAttribution,
  type ParsedClickAttribution,
} from "@/lib/click-attribution";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface RecordClickAttributionOptions {
  /** Full click request URL or search params from the widget. */
  trackingUrl?: URL | string;
  /** Explicit attribution when not using URL params (e.g. test sandbox). */
  attribution?: Partial<ParsedClickAttribution>;
  headers?: Headers;
}

function mergeAttribution(
  fromUrl: ParsedClickAttribution,
  override?: Partial<ParsedClickAttribution>
): ParsedClickAttribution {
  if (!override) return fromUrl;
  return {
    widget_url: override.widget_url ?? fromUrl.widget_url,
    page: override.page ?? fromUrl.page,
    publisher_id: override.publisher_id ?? fromUrl.publisher_id,
    intent_product: override.intent_product ?? fromUrl.intent_product,
    product_choose: override.product_choose ?? fromUrl.product_choose,
    product_selection:
      override.product_selection?.length
        ? override.product_selection
        : fromUrl.product_selection,
    geo_country: override.geo_country ?? fromUrl.geo_country,
    placement: override.placement ?? fromUrl.placement,
    ad_id: override.ad_id ?? fromUrl.ad_id,
  };
}

export async function buildClickInsertPayload(
  supabase: SupabaseClient,
  campaignId: string,
  ad: { id: string; name: string; title?: string | null },
  campaignName: string,
  options?: RecordClickAttributionOptions
) {
  const trackingUrl =
    typeof options?.trackingUrl === "string"
      ? new URL(options.trackingUrl, "https://click.local")
      : options?.trackingUrl ?? new URL(`https://click.local/click/${campaignId}`);

  const fromUrl = parseClickAttribution(trackingUrl, options?.headers);
  const attribution = mergeAttribution(fromUrl, options?.attribution);

  let publisherId = attribution.publisher_id;
  if (publisherId) {
    const { data: publisher } = await supabase
      .from("publishers")
      .select("id")
      .eq("id", publisherId)
      .maybeSingle();
    if (!publisher) publisherId = null;
  }

  const productChoose =
    attribution.product_choose?.trim() ||
    [campaignName, ad.title || ad.name].filter(Boolean).join(" · ");

  return {
    publisher_id: publisherId,
    widget_url: attribution.widget_url,
    page: attribution.page,
    intent_product: attribution.intent_product,
    product_choose: productChoose,
    product_selection:
      attribution.product_selection.length > 0
        ? attribution.product_selection
        : null,
    geo_country: attribution.geo_country,
    placement: attribution.placement,
  };
}
