import { getAdvertiserAccountId } from "@/lib/api/advertiser-account";
import { createClient } from "@/lib/supabase/server";
import type { Ad, Campaign } from "@/lib/types";
import type { CampaignWithMetrics } from "@/lib/campaign-types";
import { buildCampaignWithMetrics } from "@/lib/api/compute-metrics";
import { loadLastPostbackAt } from "@/lib/api/campaign-tracking";
import { normalizeCampaignStatus } from "@/lib/campaign-status";
import type { AdvertiserMetricsSnapshot } from "@/lib/metrics-from-snapshot";

function mapCampaignRow(row: Campaign): Campaign {
  return {
    ...row,
    status: normalizeCampaignStatus(row.status),
    cpc_bid: Number(row.cpc_bid),
    daily_budget: row.daily_budget != null ? Number(row.daily_budget) : null,
    total_budget: row.total_budget != null ? Number(row.total_budget) : null,
  };
}

export async function loadAdvertiserMetricsSnapshot(
  historyDays: number | null = 90
): Promise<AdvertiserMetricsSnapshot> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { campaigns: [], ads: [], clicks: [], conversions: [] };
  }

  const accountId = await getAdvertiserAccountId(supabase, user.id);
  if (!accountId) {
    return { campaigns: [], ads: [], clicks: [], conversions: [] };
  }

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("advertiser_id", accountId)
    .order("updated_at", { ascending: false });

  if (error || !campaigns?.length) {
    return { campaigns: [], ads: [], clicks: [], conversions: [] };
  }

  const campaignIds = campaigns.map((c) => c.id);

  let clicksQuery = supabase
    .from("clicks")
    .select("campaign_id, ad_id, click_id, cost, created_at")
    .in("campaign_id", campaignIds);

  if (historyDays != null) {
    const since = new Date();
    since.setDate(since.getDate() - historyDays);
    clicksQuery = clicksQuery.gte("created_at", since.toISOString());
  }

  const [{ data: ads }, { data: clicks }] = await Promise.all([
    supabase.from("ads").select("*").in("campaign_id", campaignIds),
    clicksQuery,
  ]);

  const clickIds = (clicks ?? []).map((c) => c.click_id);
  const { data: conversions } = clickIds.length
    ? await supabase
        .from("conversions")
        .select("click_id, value, created_at")
        .in("click_id", clickIds)
    : { data: [] as { click_id: string; value: number; created_at: string }[] };

  return {
    campaigns: (campaigns as Campaign[]).map(mapCampaignRow),
    ads: (ads ?? []) as Ad[],
    clicks: clicks ?? [],
    conversions: conversions ?? [],
  };
}

export async function loadCampaignsWithMetrics(): Promise<CampaignWithMetrics[]> {
  const { campaignsWithMetricsFromSnapshot } =
    await import("@/lib/metrics-from-snapshot");
  const snapshot = await loadAdvertiserMetricsSnapshot(null);
  return campaignsWithMetricsFromSnapshot(snapshot, "all");
}

export async function loadCampaignWithMetrics(
  id: string
): Promise<CampaignWithMetrics | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !campaign) return null;

  const [{ data: ads }, { data: clicks }] = await Promise.all([
    supabase.from("ads").select("*").eq("campaign_id", id),
    supabase
      .from("clicks")
      .select("campaign_id, ad_id, click_id, cost")
      .eq("campaign_id", id),
  ]);

  const clickIds = (clicks ?? []).map((c) => c.click_id);
  const [{ data: conversions }, lastPostbackAt] = await Promise.all([
    clickIds.length
      ? supabase
          .from("conversions")
          .select("click_id, value")
          .in("click_id", clickIds)
      : Promise.resolve({
          data: [] as { click_id: string; value: number }[],
        }),
    loadLastPostbackAt(supabase, clickIds),
  ]);

  return {
    ...buildCampaignWithMetrics(
      mapCampaignRow(campaign),
      ads ?? [],
      clicks ?? [],
      conversions ?? []
    ),
    last_postback_at: lastPostbackAt,
  };
}

export async function loadDashboardClicks(days = 14) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { clicks: [], conversions: [] };

  const since = new Date();
  since.setDate(since.getDate() - days);

  const accountId = await getAdvertiserAccountId(supabase, user.id);
  if (!accountId) return { clicks: [], conversions: [] };

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("advertiser_id", accountId);

  const ids = campaigns?.map((c) => c.id) ?? [];
  if (!ids.length) return { clicks: [], conversions: [] };

  const { data: clicks } = await supabase
    .from("clicks")
    .select("campaign_id, cost, created_at, click_id")
    .in("campaign_id", ids)
    .gte("created_at", since.toISOString());

  const clickIds = (clicks ?? []).map((c) => c.click_id);
  const { data: conversions } = clickIds.length
    ? await supabase
        .from("conversions")
        .select("click_id, value, created_at")
        .in("click_id", clickIds)
    : { data: [] as { click_id: string; value: number; created_at: string }[] };

  return { clicks: clicks ?? [], conversions: conversions ?? [] };
}

export async function loadAdvertiserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const accountId = await getAdvertiserAccountId(supabase, user.id);
  if (!accountId) return null;

  const { data, error } = await supabase
    .from("advertisers")
    .select("*")
    .eq("id", accountId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    email: (data.email as string) ?? user.email ?? "",
    wallet_balance: Number(data.wallet_balance),
    created_at: data.created_at as string,
    name: user.user_metadata?.full_name as string | undefined,
  };
}
