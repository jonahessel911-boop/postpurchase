import { destinationUrlWithClickId } from "@/lib/url";
import { recordPostback, type PostbackResult } from "@/lib/api/postback";
import { buildClickInsertPayload } from "@/lib/api/record-click";
import { getServiceClient, hasServiceClient } from "@/lib/supabase/service";
import type { ParsedClickAttribution } from "@/lib/click-attribution";

export type { PostbackResult };

export interface ClickResult {
  clickId: string;
  destinationUrl: string;
  adId: string;
  cost: number;
  campaignId: string;
  conversionGoal: string;
}

export async function recordTestClick(
  campaignId: string,
  options?: {
    trackingUrl?: string;
    attribution?: Partial<ParsedClickAttribution>;
  }
): Promise<ClickResult> {
  if (!hasServiceClient()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing — add it to .env.local and restart."
    );
  }

  const supabase = getServiceClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*, advertisers!inner(id, wallet_balance)")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.status === "rejected" || !campaign.on_off) {
    throw new Error("Campaign is not active");
  }

  const today = new Date().toISOString().split("T")[0];
  if (campaign.start_date && campaign.start_date > today) {
    throw new Error("Campaign has not started yet");
  }
  if (campaign.end_date && campaign.end_date < today) {
    throw new Error("Campaign has ended");
  }

  const walletBalance = Number(campaign.advertisers.wallet_balance);
  const cpcBid = Number(campaign.cpc_bid);

  if (walletBalance < cpcBid) {
    await supabase.from("campaigns").update({ on_off: false }).eq("id", campaignId);
    throw new Error("Insufficient wallet balance — top up in Settings");
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
    throw new Error("Daily budget exhausted");
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
    throw new Error("Total budget exhausted");
  }

  const { data: activeAds, error: adsError } = await supabase
    .from("ads")
    .select("id, name, title, is_draft")
    .eq("campaign_id", campaignId)
    .eq("active", true);

  const eligibleAds = (activeAds ?? []).filter((a) => !a.is_draft);

  if (adsError || !eligibleAds.length) {
    throw new Error("No active ads on this campaign");
  }

  let ad = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
  const trackingUrl = options?.trackingUrl
    ? new URL(options.trackingUrl, "https://click.local")
    : undefined;
  if (trackingUrl) {
    const adId = trackingUrl.searchParams.get("ad_id") ?? trackingUrl.searchParams.get("ad");
    if (adId) {
      const chosen = eligibleAds.find((a) => a.id === adId);
      if (chosen) ad = chosen;
    }
  }

  const clickId = crypto.randomUUID();
  const attributionPayload = await buildClickInsertPayload(
    supabase,
    campaignId,
    ad,
    campaign.name as string,
    { trackingUrl, attribution: options?.attribution }
  );

  const { error: clickError } = await supabase.from("clicks").insert({
    campaign_id: campaignId,
    ad_id: ad.id,
    click_id: clickId,
    cost: cpcBid,
    ...attributionPayload,
  });

  if (clickError) {
    throw new Error("Failed to record click in database");
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

  const rawDest = campaign.destination_url || "https://example.com";
  const destinationUrl = destinationUrlWithClickId(rawDest, clickId);
  const conversionGoal = campaign.conversion_goal ?? "lead";

  return {
    clickId,
    destinationUrl,
    adId: ad.id,
    cost: cpcBid,
    campaignId,
    conversionGoal,
  };
}

export async function recordTestPostback(input: {
  clickId: string;
  value?: number;
}): Promise<PostbackResult> {
  return recordPostback(input.clickId, input.value ?? 0);
}
