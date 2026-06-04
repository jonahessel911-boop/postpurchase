import { getAdvertiserAccountId } from "@/lib/api/advertiser-account";
import { createClient } from "@/lib/supabase/server";
import type { Ad, Campaign } from "@/lib/types";
import { pickAdForTraffic } from "@/lib/ads";

export interface TestOffer {
  campaign: Campaign;
  ad: Ad;
}

export async function loadRandomTestOffer(
  campaignId?: string
): Promise<TestOffer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const accountId = await getAdvertiserAccountId(supabase, user.id);
  if (!accountId) return null;

  let query = supabase
    .from("campaigns")
    .select("*, ads(*)")
    .eq("advertiser_id", accountId)
    .eq("on_off", true)
    .neq("status", "rejected")
    .eq("on_off", true);

  if (campaignId) {
    query = query.eq("id", campaignId);
  }

  const { data: rows, error } = await query;
  if (error || !rows?.length) return null;

  type CampaignRow = Campaign & { ads: Ad[] };
  const eligible = (rows as CampaignRow[]).filter((c) =>
    c.ads.some((a) => a.active)
  );

  if (!eligible.length) return null;

  const campaign =
    eligible[Math.floor(Math.random() * eligible.length)];
  const ad = pickAdForTraffic(campaign.ads.filter((a) => a.active));
  if (!ad) return null;

  const { ads: _ads, ...campaignFields } = campaign;

  return {
    campaign: {
      ...campaignFields,
      conversion_goal: campaignFields.conversion_goal ?? "lead",
    },
    ad,
  };
}
