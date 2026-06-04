import { parseClickAttribution } from "@/lib/click-attribution";
import { buildClickInsertPayload } from "@/lib/api/record-click";
import { destinationUrlWithClickId } from "@/lib/url";
import { getServiceClient, hasServiceClient } from "@/lib/supabase/service";

export class ClickProcessingError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Records a paid click and returns the advertiser destination URL (with click_id).
 */
export async function processClickAndGetDestination(
  campaignId: string,
  requestUrl: URL,
  headers?: Headers
): Promise<{ clickId: string; destinationUrl: string }> {
  if (!hasServiceClient()) {
    throw new ClickProcessingError("Click API not configured", 503);
  }

  const supabase = getServiceClient();
  const attribution = parseClickAttribution(requestUrl, headers);

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*, advertisers!inner(id, wallet_balance)")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new ClickProcessingError("Campaign not found", 404);
  }

  if (campaign.status === "rejected" || !campaign.on_off) {
    throw new ClickProcessingError("Campaign not active", 403);
  }

  const today = new Date().toISOString().split("T")[0];
  if (campaign.start_date && campaign.start_date > today) {
    throw new ClickProcessingError("Campaign not started", 403);
  }
  if (campaign.end_date && campaign.end_date < today) {
    throw new ClickProcessingError("Campaign ended", 403);
  }

  const walletBalance = Number(campaign.advertisers.wallet_balance);
  const cpcBid = Number(campaign.cpc_bid);

  if (walletBalance < cpcBid) {
    await supabase.from("campaigns").update({ on_off: false }).eq("id", campaignId);
    throw new ClickProcessingError("Insufficient wallet balance", 402);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todaySpend } = await supabase
    .from("clicks")
    .select("cost")
    .eq("campaign_id", campaignId)
    .gte("created_at", todayStart.toISOString());

  const dailySpent = (todaySpend ?? []).reduce(
    (sum, c) => sum + Number(c.cost),
    0
  );
  if (
    campaign.daily_budget &&
    dailySpent + cpcBid > Number(campaign.daily_budget)
  ) {
    await supabase.from("campaigns").update({ on_off: false }).eq("id", campaignId);
    throw new ClickProcessingError("Daily budget exhausted", 402);
  }

  const { data: totalSpend } = await supabase
    .from("clicks")
    .select("cost")
    .eq("campaign_id", campaignId);

  const totalSpent = (totalSpend ?? []).reduce(
    (sum, c) => sum + Number(c.cost),
    0
  );
  if (
    campaign.total_budget &&
    totalSpent + cpcBid > Number(campaign.total_budget)
  ) {
    await supabase.from("campaigns").update({ on_off: false }).eq("id", campaignId);
    throw new ClickProcessingError("Total budget exhausted", 402);
  }

  const { data: activeAds, error: adsError } = await supabase
    .from("ads")
    .select("id, name, title, is_draft")
    .eq("campaign_id", campaignId)
    .eq("active", true);

  const eligibleAds = (activeAds ?? []).filter((a) => !a.is_draft);

  if (adsError || !eligibleAds.length) {
    throw new ClickProcessingError("No active ads", 403);
  }

  let ad = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
  if (attribution.ad_id) {
    const chosen = eligibleAds.find((a) => a.id === attribution.ad_id);
    if (chosen) ad = chosen;
  }

  const clickId = crypto.randomUUID();
  const attributionPayload = await buildClickInsertPayload(
    supabase,
    campaignId,
    ad,
    campaign.name as string,
    { trackingUrl: requestUrl, headers }
  );

  const { error: clickError } = await supabase.from("clicks").insert({
    campaign_id: campaignId,
    ad_id: ad.id,
    click_id: clickId,
    cost: cpcBid,
    ...attributionPayload,
  });

  if (clickError) {
    throw new ClickProcessingError("Failed to record click", 500);
  }

  const newBalance = walletBalance - cpcBid;
  await supabase
    .from("advertisers")
    .update({ wallet_balance: newBalance })
    .eq("id", campaign.advertiser_id);

  if (newBalance <= 0) {
    await supabase
      .from("campaigns")
      .update({ on_off: false })
      .eq("advertiser_id", campaign.advertiser_id);
  }

  const rawDest = (campaign.destination_url as string) || "https://example.com";
  const destinationUrl = destinationUrlWithClickId(rawDest, clickId);

  return { clickId, destinationUrl };
}
