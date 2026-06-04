import type { PublisherPlacement } from "@/lib/publisher-types";
import {
  dateRangeBounds,
  isWithinDateRange,
  type DateRangePreset,
} from "@/lib/date-range";
import { buildWidgetPageUrl, normalizePagePath } from "@/lib/widget-url";
import {
  publisherCtr,
  publisherEarningsFromClickCost,
} from "@/lib/publisher-revenue";
import {
  bucketKeyFromIso,
  buildChartSeries,
  defaultGranularityForPreset,
  type ChartGranularity,
} from "@/lib/chart-series";

export interface PlacementWithMetrics extends PublisherPlacement {
  metrics: {
    clicks: number;
    conversions: number;
    offersShown: number;
    revenue: number;
    ctr: number;
  };
}

export interface PublisherMetricsSnapshot {
  placements: PublisherPlacement[];
  clicks: {
    click_id: string;
    cost: number;
    created_at: string;
    page: string | null;
    widget_url: string | null;
  }[];
  conversions: { click_id: string; created_at: string }[];
  /** One row per widget load where offers were displayed. */
  impressions: {
    placement_id: string;
    offer_count: number;
    created_at: string;
  }[];
}

export interface PublisherDashboardTotals {
  clicks: number;
  revenue: number;
  offersShown: number;
  ctr: number;
  activeOffers: number;
}

export function placementsWithMetrics(
  snapshot: PublisherMetricsSnapshot,
  preset: DateRangePreset
): PlacementWithMetrics[] {
  const { clicks, conversions } = filterPublisherByRange(snapshot, preset);
  const clickIdsWithConv = new Set(conversions.map((c) => c.click_id));

  const { impressions } = filterPublisherByRange(snapshot, preset);

  return snapshot.placements.map((p) => {
    const placementClicks = clicksForPlacement(p, clicks);
    const placementImpressions = impressionsForPlacement(p, impressions);
    const clickCount = placementClicks.length;
    const revenue = publisherEarningsFromClickCost(
      placementClicks.reduce((s, c) => s + c.cost, 0)
    );

    return {
      ...p,
      metrics: {
        clicks: clickCount,
        conversions: placementClicks.filter((c) =>
          clickIdsWithConv.has(c.click_id)
        ).length,
        offersShown: placementImpressions.length,
        revenue,
        ctr: publisherCtr(clickCount, placementImpressions.length),
      },
    };
  });
}

function clicksForPlacement(
  placement: PublisherPlacement,
  clicks: PublisherMetricsSnapshot["clicks"]
) {
  const path = normalizePagePath(placement.page_path).replace(/^\//, "");
  const widgetBase = buildWidgetPageUrl(placement.site_url, placement.page_path);

  return clicks.filter((c) => {
    if (c.page && c.page === path) return true;
    if (c.widget_url && widgetBase && c.widget_url.startsWith(widgetBase)) {
      return true;
    }
    if (c.widget_url && c.widget_url.includes(path)) return true;
    return false;
  });
}

function filterPublisherByRange(
  snapshot: PublisherMetricsSnapshot,
  preset: DateRangePreset
) {
  const { since, until } = dateRangeBounds(preset);
  const clicks = snapshot.clicks.filter((c) =>
    isWithinDateRange(c.created_at, since, until)
  );
  const impressions = snapshot.impressions.filter((i) =>
    isWithinDateRange(i.created_at, since, until)
  );
  const clickIds = new Set(clicks.map((c) => c.click_id));
  const conversions = snapshot.conversions.filter((c) =>
    clickIds.has(c.click_id)
  );
  return { clicks, conversions, impressions };
}

function impressionsForPlacement(
  placement: PublisherPlacement,
  impressions: PublisherMetricsSnapshot["impressions"]
) {
  return impressions.filter((i) => i.placement_id === placement.id);
}

export function publisherTotals(
  snapshot: PublisherMetricsSnapshot,
  preset: DateRangePreset
): PublisherDashboardTotals {
  const { clicks, impressions } = filterPublisherByRange(snapshot, preset);
  const offersShown = impressions.length;
  const clickCount = clicks.length;

  return {
    clicks: clickCount,
    revenue: publisherEarningsFromClickCost(
      clicks.reduce((s, c) => s + c.cost, 0)
    ),
    offersShown,
    ctr: publisherCtr(clickCount, offersShown),
    activeOffers: snapshot.placements.filter((p) => p.active).length,
  };
}

export interface PublisherChartPoint {
  date: string;
  label: string;
  clicks: number;
  revenue: number;
  offersShown: number;
  ctr: number;
}

export function buildPublisherChartSeries(
  snapshot: PublisherMetricsSnapshot,
  preset: DateRangePreset,
  granularity: ChartGranularity = defaultGranularityForPreset(preset)
): PublisherChartPoint[] {
  const { clicks, impressions } = filterPublisherByRange(snapshot, preset);
  const base = buildChartSeries(
    clicks.map((c) => ({ cost: c.cost, created_at: c.created_at })),
    [],
    preset,
    granularity
  );

  const impressionsByKey = new Map<string, number>();
  for (const imp of impressions) {
    const key = bucketKeyFromIso(imp.created_at, granularity);
    impressionsByKey.set(key, (impressionsByKey.get(key) ?? 0) + 1);
  }

  return base.map((p) => {
    const offersShown = impressionsByKey.get(p.date) ?? 0;
    return {
      date: p.date,
      label: p.label,
      clicks: p.clicks,
      revenue: publisherEarningsFromClickCost(p.spend),
      offersShown,
      ctr: publisherCtr(p.clicks, offersShown),
    };
  });
}

export function buildPublisherDashboardData(
  snapshot: PublisherMetricsSnapshot,
  preset: DateRangePreset
) {
  const totals = publisherTotals(snapshot, preset);
  const dailySeries = buildPublisherChartSeries(snapshot, preset, "daily");

  return {
    totals,
    sparklines: {
      clicks: dailySeries.map((r) => r.clicks),
      revenue: dailySeries.map((r) => r.revenue),
      ctr: dailySeries.map((r) => r.ctr),
    },
  };
}
