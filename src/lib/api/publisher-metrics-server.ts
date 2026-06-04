import { getPublisherAccountId } from "@/lib/api/advertiser-account";
import { createClient } from "@/lib/supabase/server";
import type { PublisherPlacement } from "@/lib/publisher-types";
import type { PublisherMetricsSnapshot } from "@/lib/api/publisher-metrics-shared";

export type {
  PlacementWithMetrics,
  PublisherMetricsSnapshot,
} from "@/lib/api/publisher-metrics-shared";

export {
  placementsWithMetrics,
  publisherTotals,
  buildPublisherDashboardData,
} from "@/lib/api/publisher-metrics-shared";

export async function loadPublisherMetricsSnapshot(
  publisherId: string
): Promise<PublisherMetricsSnapshot> {
  const supabase = await createClient();

  const [
    { data: placements },
    { data: clicks },
    { data: impressions, error: impressionsError },
  ] = await Promise.all([
    supabase
      .from("publisher_placements")
      .select("*")
      .eq("publisher_id", publisherId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("clicks")
      .select("click_id, cost, created_at, publisher_id, page, widget_url")
      .eq("publisher_id", publisherId),
    supabase
      .from("publisher_offer_impressions")
      .select("placement_id, offer_count, created_at")
      .eq("publisher_id", publisherId),
  ]);

  const clickIds = (clicks ?? []).map((c) => c.click_id as string);
  const { data: conversions } = clickIds.length
    ? await supabase
        .from("conversions")
        .select("click_id, created_at")
        .in("click_id", clickIds)
    : { data: [] as { click_id: string; created_at: string }[] };

  return {
    placements: (placements ?? []) as PublisherPlacement[],
    clicks: (clicks ?? []).map((c) => ({
      click_id: c.click_id as string,
      cost: Number(c.cost),
      created_at: c.created_at as string,
      page: (c.page as string | null) ?? null,
      widget_url: (c.widget_url as string | null) ?? null,
    })),
    conversions: conversions ?? [],
    impressions: impressionsError
      ? []
      : (impressions ?? []).map((row) => ({
      placement_id: row.placement_id as string,
      offer_count: Number(row.offer_count ?? 0),
      created_at: row.created_at as string,
    })),
  };
}

export async function loadPublisherDashboardContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const publisherId = await getPublisherAccountId(supabase, user.id);
  if (!publisherId) return null;

  const { data: publisher } = await supabase
    .from("publishers")
    .select("company_name, contact_email, status")
    .eq("id", publisherId)
    .maybeSingle();

  const snapshot = await loadPublisherMetricsSnapshot(publisherId);

  return {
    user,
    publisherId,
    publisher,
    snapshot,
  };
}
