import type { AdWithMetrics } from "@/lib/types";
import type { CampaignWithMetrics } from "@/lib/campaign-types";
import { isAdDelivering } from "@/lib/campaign-status";

export function campaignDisplayId(id: string): string {
  const num = id.replace(/\D/g, "");
  const padded = String(2400 + parseInt(num || "1", 10)).padStart(4, "0");
  return `CMP-${padded}`;
}

export function formatRelativeUpdated(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export type SortDir = "asc" | "desc";

export type CampaignSortKey =
  | "on_off"
  | "campaign"
  | "vertical"
  | "status"
  | "spend"
  | "daily_budget"
  | "clicks"
  | "ctr"
  | "conversions"
  | "cpa"
  | "revenue"
  | "roas";

export type AdSortKey =
  | "ad"
  | "campaign"
  | "status"
  | "spend"
  | "daily_budget"
  | "clicks"
  | "ctr"
  | "conversions"
  | "cpa"
  | "revenue"
  | "roas"
  | "impressions"
  | "ends"
  | "bid"
  | "last_edit";

export interface AdRow {
  ad: AdWithMetrics;
  campaign: CampaignWithMetrics;
}

export function flattenAds(campaigns: CampaignWithMetrics[]): AdRow[] {
  return campaigns.flatMap((campaign) =>
    campaign.ads
      .filter((ad) => !(ad.is_draft ?? false))
      .map((ad) => ({ ad, campaign }))
  );
}

export function estimateRevenueFromMetrics(
  conversions: number,
  cpa: number
): number {
  return conversions * (cpa > 0 ? cpa * 4.2 : 0);
}

export function estimateRevenue(c: CampaignWithMetrics): number {
  return estimateRevenueFromMetrics(c.metrics.conversions, c.metrics.cpa);
}

export function estimateRoasFromMetrics(spend: number, revenue: number): number {
  return spend > 0 ? revenue / spend : 0;
}

export function estimateRoas(c: CampaignWithMetrics): number {
  return estimateRoasFromMetrics(c.metrics.spend, estimateRevenue(c));
}

export function adRevenue(ad: AdWithMetrics): number {
  return estimateRevenueFromMetrics(ad.metrics.conversions, ad.metrics.cpa);
}

export function adRoas(ad: AdWithMetrics): number {
  return estimateRoasFromMetrics(ad.metrics.spend, adRevenue(ad));
}

export function sortCampaigns(
  campaigns: CampaignWithMetrics[],
  key: CampaignSortKey,
  dir: SortDir
): CampaignWithMetrics[] {
  const m = dir === "asc" ? 1 : -1;
  return [...campaigns].sort((a, b) => {
    switch (key) {
      case "on_off":
        return m * (Number(a.on_off) - Number(b.on_off));
      case "campaign":
        return m * a.name.localeCompare(b.name);
      case "vertical":
        return m * a.vertical.localeCompare(b.vertical);
      case "status":
        return m * statusRank(a).localeCompare(statusRank(b));
      case "spend":
        return m * (a.metrics.spend - b.metrics.spend);
      case "daily_budget":
        return m * (Number(a.daily_budget ?? 0) - Number(b.daily_budget ?? 0));
      case "clicks":
        return m * (a.metrics.clicks - b.metrics.clicks);
      case "ctr":
        return m * (a.metrics.ctr - b.metrics.ctr);
      case "conversions":
        return m * (a.metrics.conversions - b.metrics.conversions);
      case "cpa":
        return m * (a.metrics.cpa - b.metrics.cpa);
      case "revenue":
        return m * (estimateRevenue(a) - estimateRevenue(b));
      case "roas":
        return m * (estimateRoas(a) - estimateRoas(b));
      default:
        return 0;
    }
  });
}

export function sortAds(rows: AdRow[], key: AdSortKey, dir: SortDir): AdRow[] {
  const m = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (key) {
      case "ad":
        return m * a.ad.name.localeCompare(b.ad.name);
      case "campaign":
        return m * a.campaign.name.localeCompare(b.campaign.name);
      case "status":
        return m * adStatusRank(a).localeCompare(adStatusRank(b));
      case "spend":
        return m * (a.ad.metrics.spend - b.ad.metrics.spend);
      case "daily_budget":
        return (
          m *
          (Number(a.campaign.daily_budget ?? 0) -
            Number(b.campaign.daily_budget ?? 0))
        );
      case "clicks":
        return m * (a.ad.metrics.clicks - b.ad.metrics.clicks);
      case "ctr":
        return m * (a.ad.metrics.ctr - b.ad.metrics.ctr);
      case "conversions":
        return m * (a.ad.metrics.conversions - b.ad.metrics.conversions);
      case "cpa":
        return m * (a.ad.metrics.cpa - b.ad.metrics.cpa);
      case "revenue":
        return m * (adRevenue(a.ad) - adRevenue(b.ad));
      case "roas":
        return m * (adRoas(a.ad) - adRoas(b.ad));
      case "impressions":
        return m * (a.ad.metrics.impressions - b.ad.metrics.impressions);
      case "ends": {
        const aEnd = a.campaign.end_date
          ? new Date(a.campaign.end_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        const bEnd = b.campaign.end_date
          ? new Date(b.campaign.end_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        return m * (aEnd - bEnd);
      }
      case "bid":
        return m * (Number(a.campaign.cpc_bid) - Number(b.campaign.cpc_bid));
      case "last_edit":
        return (
          m *
          (new Date(a.campaign.updated_at).getTime() -
            new Date(b.campaign.updated_at).getTime())
        );
      default:
        return 0;
    }
  });
}

function statusRank(c: CampaignWithMetrics): string {
  if (c.status === "rejected") return "0";
  if (c.on_off) return "2";
  return "1";
}

function adStatusRank(row: AdRow): string {
  if (row.campaign.status === "rejected") return "0";
  if (isAdDelivering(row.campaign, row.ad.active)) return "2";
  return "1";
}

export interface CampaignTotals {
  spend: number;
  dailyBudget: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
}

function aggregateImpressions(campaigns: CampaignWithMetrics[]): number {
  return campaigns.reduce(
    (s, c) => s + c.ads.reduce((a, ad) => a + ad.metrics.impressions, 0),
    0
  );
}

export function aggregateCampaignTotals(
  campaigns: CampaignWithMetrics[]
): CampaignTotals {
  const spend = campaigns.reduce((s, c) => s + c.metrics.spend, 0);
  const dailyBudget = campaigns.reduce(
    (s, c) => s + Number(c.daily_budget ?? 0),
    0
  );
  const clicks = campaigns.reduce((s, c) => s + c.metrics.clicks, 0);
  const impressions = aggregateImpressions(campaigns);
  const conversions = campaigns.reduce((s, c) => s + c.metrics.conversions, 0);
  const revenue = campaigns.reduce((s, c) => s + estimateRevenue(c), 0);
  return {
    spend,
    dailyBudget,
    clicks,
    ctr: impressions > 0 ? clicks / impressions : 0,
    conversions,
    cpa: conversions > 0 ? spend / conversions : 0,
    revenue,
    roas: spend > 0 ? revenue / spend : 0,
  };
}

export interface AdTotals {
  activeAds: number;
  spend: number;
  dailyBudget: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  roas: number;
}

export function aggregateAdTotals(rows: AdRow[]): AdTotals {
  const spend = rows.reduce((s, r) => s + r.ad.metrics.spend, 0);
  const clicks = rows.reduce((s, r) => s + r.ad.metrics.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.ad.metrics.impressions, 0);
  const conversions = rows.reduce((s, r) => s + r.ad.metrics.conversions, 0);
  const revenue = rows.reduce((s, r) => s + adRevenue(r.ad), 0);
  const activeAds = rows.filter(
    (r) => isAdDelivering(r.campaign, r.ad.active)
  ).length;
  const seenCampaigns = new Set<string>();
  let dailyBudget = 0;
  for (const row of rows) {
    if (seenCampaigns.has(row.campaign.id)) continue;
    seenCampaigns.add(row.campaign.id);
    dailyBudget += Number(row.campaign.daily_budget ?? 0);
  }
  return {
    activeAds,
    spend,
    dailyBudget,
    clicks,
    ctr: impressions > 0 ? clicks / impressions : 0,
    conversions,
    cpa: conversions > 0 ? spend / conversions : 0,
    roas: spend > 0 ? revenue / spend : 0,
  };
}

export type SavedView = {
  id: string;
  label: string;
  status?: string;
  vertical?: string;
  sortKey?: CampaignSortKey | AdSortKey;
};

export const SAVED_VIEWS: SavedView[] = [
  { id: "all", label: "All campaigns" },
  { id: "active", label: "Active only", status: "active" },
  { id: "paused", label: "Paused only", status: "paused" },
  { id: "high-spend", label: "High spend", sortKey: "spend" },
  { id: "top-roas", label: "Top ROAS", sortKey: "roas" },
];
