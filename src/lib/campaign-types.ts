import type { AdWithMetrics, Campaign, Vertical } from "./types";
import { VERTICALS } from "./types";

export interface CampaignWithMetrics extends Campaign {
  ads: AdWithMetrics[];
  metrics: {
    spend: number;
    clicks: number;
    cpc: number;
    ctr: number;
    conversions: number;
    cpa: number;
  };
}

export function verticalLabel(v: Vertical): string {
  return VERTICALS.find((x) => x.value === v)?.label ?? v;
}
