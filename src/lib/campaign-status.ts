import type { Campaign, CampaignStatus } from "@/lib/types";

/** Map legacy DB values (e.g. pending) to the current status model. */
export function normalizeCampaignStatus(status: string): CampaignStatus {
  return status === "rejected" ? "rejected" : "approved";
}

export function isCampaignRejected(status: CampaignStatus): boolean {
  return status === "rejected";
}

/** Campaign switch is on and not rejected — may deliver traffic. */
export function isCampaignOn(
  campaign: Pick<Campaign, "status" | "on_off">
): boolean {
  return campaign.on_off && !isCampaignRejected(campaign.status);
}

export function isAdDelivering(
  campaign: Pick<Campaign, "status" | "on_off">,
  adActive: boolean
): boolean {
  return isCampaignOn(campaign) && adActive;
}
