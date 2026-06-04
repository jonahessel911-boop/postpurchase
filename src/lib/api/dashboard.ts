import type { CampaignWithMetrics } from "@/lib/campaign-types";
import { buildTimeSeries } from "@/lib/metrics";
import type { DateRangePreset } from "@/lib/date-range";
import {
  campaignsWithMetricsFromSnapshot,
  filteredClickStreamForChart,
  type AdvertiserMetricsSnapshot,
} from "@/lib/metrics-from-snapshot";

export interface DashboardData {
  totals: {
    spend: number;
    clicks: number;
    cpc: number;
    conversions: number;
    cpa: number;
    revenue: number;
    roas: number;
    activeCampaigns: number;
  };
  chartStream: {
    clicks: { cost: number; created_at: string }[];
    conversions: { value: number; created_at: string }[];
  };
  sparklines: Record<string, number[]>;
  campaigns: CampaignWithMetrics[];
}

function sparklineFromSeries(
  series: { spend: number; clicks: number; conversions: number }[],
  key: "spend" | "clicks" | "conversions"
): number[] {
  return series.map((row) => row[key]);
}

export function buildDashboardData(
  snapshot: AdvertiserMetricsSnapshot,
  preset: DateRangePreset
): DashboardData {
  const campaigns = campaignsWithMetricsFromSnapshot(snapshot, preset);
  const { clicks, conversions, days } = filteredClickStreamForChart(
    snapshot,
    preset
  );

  const spend = campaigns.reduce((s, c) => s + c.metrics.spend, 0);
  const clickCount = campaigns.reduce((s, c) => s + c.metrics.clicks, 0);
  const conversionsCount = campaigns.reduce(
    (s, c) => s + c.metrics.conversions,
    0
  );
  const revenue = conversions.reduce((s, c) => s + c.value, 0);

  const activeCampaigns = campaigns.filter(
    (c) => c.on_off && c.status !== "rejected"
  ).length;

  const series = buildTimeSeries(clicks, conversions, days);

  return {
    totals: {
      spend,
      clicks: clickCount,
      cpc: clickCount > 0 ? spend / clickCount : 0,
      conversions: conversionsCount,
      cpa: conversionsCount > 0 ? spend / conversionsCount : 0,
      revenue,
      roas: spend > 0 ? revenue / spend : 0,
      activeCampaigns,
    },
    chartStream: { clicks, conversions },
    sparklines: {
      spend: sparklineFromSeries(series, "spend"),
      clicks: sparklineFromSeries(series, "clicks"),
      cpc: series.map((row) =>
        row.clicks > 0 ? row.spend / row.clicks : 0
      ),
      conversions: sparklineFromSeries(series, "conversions"),
      cpa: series.map((row) =>
        row.conversions > 0 ? row.spend / row.conversions : 0
      ),
      revenue: series.map((row) =>
        row.conversions > 0
          ? (revenue / Math.max(conversionsCount, 1)) * row.conversions
          : 0
      ),
      roas: series.map((row) =>
        row.spend > 0
          ? ((revenue / Math.max(conversionsCount, 1)) * row.conversions) /
            row.spend
          : 0
      ),
      active: series.map(() => activeCampaigns),
    },
    campaigns,
  };
}
