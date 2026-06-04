import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { parseClickAttribution } from "../_shared/click-attribution.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const campaignId = pathParts[pathParts.length - 1];

    if (!campaignId || campaignId === "click") {
      return new Response("Campaign ID required", { status: 400 });
    }

    const attribution = parseClickAttribution(url, req.headers);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*, advertisers!inner(id, wallet_balance)")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return new Response("Campaign not found", { status: 404 });
    }

    if (campaign.status === "rejected" || !campaign.on_off) {
      return new Response("Campaign not active", { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];
    if (campaign.start_date && campaign.start_date > today) {
      return new Response("Campaign not started", { status: 403 });
    }
    if (campaign.end_date && campaign.end_date < today) {
      return new Response("Campaign ended", { status: 403 });
    }

    const walletBalance = Number(campaign.advertisers.wallet_balance);
    const cpcBid = Number(campaign.cpc_bid);

    if (walletBalance < cpcBid) {
      await supabase
        .from("campaigns")
        .update({ on_off: false })
        .eq("id", campaignId);
      return new Response("Insufficient wallet balance", { status: 402 });
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
      await supabase
        .from("campaigns")
        .update({ on_off: false })
        .eq("id", campaignId);
      return new Response("Daily budget exhausted", { status: 402 });
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
      await supabase
        .from("campaigns")
        .update({ on_off: false })
        .eq("id", campaignId);
      return new Response("Total budget exhausted", { status: 402 });
    }

    const { data: activeAds, error: adsError } = await supabase
      .from("ads")
      .select("id, name, title, is_draft")
      .eq("campaign_id", campaignId)
      .eq("active", true);

    const eligibleAds = (activeAds ?? []).filter(
      (a) => !(a as { is_draft?: boolean }).is_draft
    );

    if (adsError || !eligibleAds.length) {
      return new Response("No active ads", { status: 403 });
    }

    let ad = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
    if (attribution.ad_id) {
      const chosen = eligibleAds.find((a) => a.id === attribution.ad_id);
      if (chosen) ad = chosen;
    }

    let publisherId: string | null = attribution.publisher_id;
    if (publisherId) {
      const { data: publisher } = await supabase
        .from("publishers")
        .select("id")
        .eq("id", publisherId)
        .maybeSingle();
      if (!publisher) publisherId = null;
    }

    const productChoose =
      attribution.product_choose?.trim() ||
      [campaign.name, ad.title || ad.name].filter(Boolean).join(" · ");

    const clickId = crypto.randomUUID();

    const { error: clickError } = await supabase.from("clicks").insert({
      campaign_id: campaignId,
      ad_id: ad.id,
      click_id: clickId,
      cost: cpcBid,
      publisher_id: publisherId,
      widget_url: attribution.widget_url,
      page: attribution.page,
      intent_product: attribution.intent_product,
      product_choose: productChoose,
      product_selection:
        attribution.product_selection.length > 0
          ? attribution.product_selection
          : null,
      geo_country: attribution.geo_country,
      placement: attribution.placement,
    });

    if (clickError) {
      return new Response("Failed to record click", { status: 500 });
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
    const destUrl = new URL(rawDest);
    destUrl.searchParams.delete("click_id");
    destUrl.searchParams.set("click_id", clickId);

    return new Response(null, {
      status: 302,
      headers: {
        Location: destUrl.toString(),
        ...corsHeaders,
      },
    });
  } catch (err) {
    return new Response(String(err), { status: 500, headers: corsHeaders });
  }
});
