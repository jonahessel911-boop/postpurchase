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
import { chartDaysForPreset } from "@/lib/date-range";

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

export function buildPublisherDashboardData(
  snapshot: PublisherMetricsSnapshot,
  preset: DateRangePreset
) {
  const totals = publisherTotals(snapshot, preset);
  const { clicks, impressions } = filterPublisherByRange(snapshot, preset);
  const days = chartDaysForPreset(preset);
  const now = new Date();

  const series: { clicks: number; revenue: number; offersShown: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const dayClicks = clicks.filter(
      (c) => c.created_at.split("T")[0] === dateStr
    );
    const dayImpressions = impressions.filter(
      (imp) => imp.created_at.split("T")[0] === dateStr
    );

    series.push({
      clicks: dayClicks.length,
      revenue: publisherEarningsFromClickCost(
        dayClicks.reduce((s, c) => s + c.cost, 0)
      ),
      offersShown: dayImpressions.length,
    });
  }

  return {
    totals,
    sparklines: {
      clicks: series.map((r) => r.clicks),
      revenue: series.map((r) => r.revenue),
      ctr: series.map((r) =>
        r.offersShown > 0 ? r.clicks / r.offersShown : 0
      ),
    },
  };
}
