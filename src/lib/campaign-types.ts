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
  /** Latest postback (conversion) timestamp for this campaign, if any. */
  last_postback_at: string | null;
}

export function verticalLabel(v: Vertical): string {
  return VERTICALS.find((x) => x.value === v)?.label ?? v;
}
