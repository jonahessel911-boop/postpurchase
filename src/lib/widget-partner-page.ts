import { getPublisherForWidget } from "@/lib/api/widget-offers";
import { hasServiceClient } from "@/lib/supabase/service";
import type { ClickPlacement } from "@/lib/types";
import { normalizePlacement } from "@/lib/click-attribution";

export type WidgetPartnerPageData =
  | { ok: true; partnerId: string; companyName: string; format: ClickPlacement; embed: boolean }
  | { ok: false; reason: "no_service" | "not_found" };

export async function loadWidgetPartnerPageData(
  placementOrPartnerId: string,
  searchParams: { embed?: string; format?: string }
): Promise<WidgetPartnerPageData> {
  if (!hasServiceClient()) {
    return { ok: false, reason: "no_service" };
  }

  const format =
    (searchParams.format ? normalizePlacement(searchParams.format) : null) ??
    "native";

  const publisher = await getPublisherForWidget(placementOrPartnerId);
  if (!publisher) {
    return { ok: false, reason: "not_found" };
  }

  return {
    ok: true,
    partnerId: publisher.id,
    companyName: publisher.company_name,
    format: format as ClickPlacement,
    embed: searchParams.embed === "1",
  };
}
