import { toClickAttributionRecord } from "@/lib/click-attribution";
import type { ClickAttributionRecord } from "@/lib/click-attribution";
import { getServiceClient } from "@/lib/supabase/service";

export type { ClickAttributionRecord };

export async function getClickAttributionByClickId(
  clickId: string
): Promise<ClickAttributionRecord | null> {
  const supabase = getServiceClient();

  const { data: click, error } = await supabase
    .from("clicks")
    .select(
      `
      click_id,
      created_at,
      campaign_id,
      ad_id,
      cost,
      widget_url,
      page,
      intent_product,
      product_choose,
      product_selection,
      geo_country,
      placement,
      publisher_id,
      publishers ( company_name )
    `
    )
    .eq("click_id", clickId)
    .maybeSingle();

  if (error || !click) return null;

  const pubRaw = click.publishers;
  const publisher = Array.isArray(pubRaw)
    ? (pubRaw[0] as { company_name: string } | undefined)
    : (pubRaw as { company_name: string } | null);

  return toClickAttributionRecord({
    click_id: click.click_id as string,
    created_at: click.created_at as string,
    campaign_id: click.campaign_id as string,
    ad_id: click.ad_id as string | null,
    cost: click.cost as number,
    widget_url: click.widget_url as string | null,
    page: click.page as string | null,
    intent_product: click.intent_product as string | null,
    product_choose: click.product_choose as string | null,
    product_selection: click.product_selection,
    geo_country: click.geo_country as string | null,
    placement: click.placement as string | null,
    publisher_id: click.publisher_id as string | null,
    publisher_name: publisher?.company_name ?? null,
  });
}
