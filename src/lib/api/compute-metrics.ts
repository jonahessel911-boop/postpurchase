import { aggregateAdMetrics, emptyAdMetrics, publishedAds } from "@/lib/ads";
import type { Ad, AdWithMetrics, Campaign } from "@/lib/types";
import type { CampaignWithMetrics } from "@/lib/campaign-types";

type ClickRow = {
  campaign_id: string;
  ad_id: string | null;
  click_id: string;
  cost: number | string;
};

type ConversionRow = {
  click_id: string;
  value: number | string;
};

function num(v: number | string): number {
  return Number(v);
}

export function attachMetricsToAds(
  ads: Ad[],
  clicks: ClickRow[],
  conversions: ConversionRow[]
): AdWithMetrics[] {
  const conversionsByClick = new Map(
    conversions.map((c) => [c.click_id, num(c.value)])
  );

  return ads.map((ad) => {
    const adClicks = clicks.filter((c) => c.ad_id === ad.id);
    const spend = adClicks.reduce((s, c) => s + num(c.cost), 0);
    const clickCount = adClicks.length;
    const convCount = adClicks.filter((c) =>
      conversionsByClick.has(c.click_id)
    ).length;

    return {
      ...ad,
      metrics: {
        spend,
        clicks: clickCount,
        cpc: clickCount > 0 ? spend / clickCount : 0,
        ctr: 0,
        conversions: convCount,
        cpa: convCount > 0 ? spend / convCount : 0,
        impressions: 0,
      },
    };
  });
}

export function buildCampaignWithMetrics(
  campaign: Campaign,
  ads: Ad[],
  clicks: ClickRow[],
  conversions: ConversionRow[]
): CampaignWithMetrics {
  const adsWithMetrics = attachMetricsToAds(ads, clicks, conversions);
  const agg = aggregateAdMetrics(publishedAds(adsWithMetrics));

  return {
    ...campaign,
    ads: adsWithMetrics,
    metrics: {
      spend: agg.spend,
      clicks: agg.clicks,
      cpc: agg.cpc,
      ctr: agg.ctr,
      conversions: agg.conversions,
      cpa: agg.cpa,
    },
  };
}

export function emptyAdWithMetrics(ad: Ad): AdWithMetrics {
  return { ...ad, metrics: emptyAdMetrics() };
}

export function emptyCampaignMetrics() {
  const agg = aggregateAdMetrics([]);
  return {
    spend: agg.spend,
    clicks: agg.clicks,
    cpc: agg.cpc,
    ctr: agg.ctr,
    conversions: agg.conversions,
    cpa: agg.cpa,
  };
}
