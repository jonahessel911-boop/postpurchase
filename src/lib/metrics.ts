import type { Campaign, Click, Conversion } from "./types";

export function computeCampaignMetrics(
  clicks: Pick<Click, "cost">[],
  conversions: Pick<Conversion, "value">[],
  impressions = 0
) {
  const spend = clicks.reduce((s, c) => s + Number(c.cost), 0);
  const clickCount = clicks.length;
  const conversionCount = conversions.length;
  const revenue = conversions.reduce((s, c) => s + Number(c.value), 0);

  return {
    spend,
    clicks: clickCount,
    cpc: clickCount > 0 ? spend / clickCount : 0,
    ctr: impressions > 0 ? clickCount / impressions : 0,
    conversions: conversionCount,
    cpa: conversionCount > 0 ? spend / conversionCount : 0,
    revenue,
    roas: spend > 0 ? revenue / spend : 0,
  };
}

export function aggregateMetrics(
  campaigns: Campaign[],
  clicksByCampaign: Record<string, Pick<Click, "cost" | "created_at">[]>,
  conversionsByClick: Record<string, Pick<Conversion, "value">[]>,
  clickIdsByCampaign: Record<string, string[]>
) {
  let totalSpend = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalRevenue = 0;

  for (const campaign of campaigns) {
    const clicks = clicksByCampaign[campaign.id] ?? [];
    const clickIds = clickIdsByCampaign[campaign.id] ?? [];
    const conversions = clickIds.flatMap(
      (id) => conversionsByClick[id] ?? []
    );

    totalSpend += clicks.reduce((s, c) => s + Number(c.cost), 0);
    totalClicks += clicks.length;
    totalConversions += conversions.length;
    totalRevenue += conversions.reduce((s, c) => s + Number(c.value), 0);
  }

  return {
    spend: totalSpend,
    clicks: totalClicks,
    cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    ctr: 0,
    conversions: totalConversions,
    cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
    revenue: totalRevenue,
    roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
  };
}

export function buildTimeSeries(
  clicks: Pick<Click, "cost" | "created_at">[],
  conversions: (Pick<Conversion, "value" | "created_at"> & { click_id: string })[],
  days = 14
) {
  const result: { date: string; spend: number; clicks: number; conversions: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const dayClicks = clicks.filter(
      (c) => c.created_at.split("T")[0] === dateStr
    );
    const dayConversions = conversions.filter(
      (c) => c.created_at.split("T")[0] === dateStr
    );

    result.push({
      date: dateStr,
      spend: dayClicks.reduce((s, c) => s + Number(c.cost), 0),
      clicks: dayClicks.length,
      conversions: dayConversions.length,
    });
  }

  return result;
}
