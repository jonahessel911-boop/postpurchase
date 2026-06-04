import { buildCampaignWithMetrics } from "@/lib/api/compute-metrics";
import type { CampaignWithMetrics } from "@/lib/campaign-types";
import {
  chartDaysForPreset,
  dateRangeBounds,
  isWithinDateRange,
  type DateRangePreset,
} from "@/lib/date-range";
import type { Ad, Campaign } from "@/lib/types";

export type MetricsClickRow = {
  campaign_id: string;
  ad_id: string | null;
  click_id: string;
  cost: number | string;
  created_at: string;
};

export type MetricsConversionRow = {
  click_id: string;
  value: number | string;
  created_at: string;
};

export interface AdvertiserMetricsSnapshot {
  campaigns: Campaign[];
  ads: Ad[];
  clicks: MetricsClickRow[];
  conversions: MetricsConversionRow[];
}

export function filterSnapshotByRange(
  snapshot: AdvertiserMetricsSnapshot,
  preset: DateRangePreset
): { clicks: MetricsClickRow[]; conversions: MetricsConversionRow[] } {
  const { since, until } = dateRangeBounds(preset);
  const clicks = snapshot.clicks.filter((c) =>
    isWithinDateRange(c.created_at, since, until)
  );
  const clickIds = new Set(clicks.map((c) => c.click_id));
  const conversions = snapshot.conversions.filter((c) =>
    clickIds.has(c.click_id)
  );
  return { clicks, conversions };
}

export function campaignsWithMetricsFromSnapshot(
  snapshot: AdvertiserMetricsSnapshot,
  preset: DateRangePreset
): CampaignWithMetrics[] {
  const { clicks, conversions } = filterSnapshotByRange(snapshot, preset);

  const adsByCampaign = new Map<string, Ad[]>();
  for (const ad of snapshot.ads) {
    const list = adsByCampaign.get(ad.campaign_id) ?? [];
    list.push(ad);
    adsByCampaign.set(ad.campaign_id, list);
  }

  const clicksByCampaign = new Map<string, MetricsClickRow[]>();
  for (const click of clicks) {
    const list = clicksByCampaign.get(click.campaign_id) ?? [];
    list.push(click);
    clicksByCampaign.set(click.campaign_id, list);
  }

  return snapshot.campaigns.map((campaign) =>
    buildCampaignWithMetrics(
      campaign,
      adsByCampaign.get(campaign.id) ?? [],
      clicksByCampaign.get(campaign.id) ?? [],
      conversions
    )
  );
}

export function filteredClickStreamForChart(
  snapshot: AdvertiserMetricsSnapshot,
  preset: DateRangePreset
) {
  const { clicks, conversions } = filterSnapshotByRange(snapshot, preset);
  return {
    clicks: clicks.map((c) => ({
      cost: Number(c.cost),
      created_at: c.created_at,
    })),
    conversions: conversions.map((c) => ({
      click_id: c.click_id,
      value: Number(c.value),
      created_at: c.created_at,
    })),
    days: chartDaysForPreset(preset),
  };
}
