import { getServiceClient } from "@/lib/supabase/service";
import { buildCampaignWithMetrics } from "@/lib/api/compute-metrics";
import { buildTimeSeries } from "@/lib/metrics";
import type { Campaign } from "@/lib/types";
import type {
  AdminAdvertiser,
  AdminCampaignRow,
  AdminChartPoint,
  AdminInvoice,
  AdminPlatformTotals,
  ClickLog,
  PostbackLog,
} from "@/lib/admin-types";
import {
  estimateRevenue,
  estimateRoas,
} from "@/lib/campaign-table-utils";

type AdvertiserRow = {
  id: string;
  email: string;
  company_name?: string | null;
  status?: string | null;
  wallet_balance: number | string;
  created_at: string;
  invoice_company_name?: string | null;
  invoice_email?: string | null;
  invoice_vat_number?: string | null;
  invoice_address_line1?: string | null;
  invoice_address_line2?: string | null;
  invoice_city?: string | null;
  invoice_postal_code?: string | null;
  invoice_country?: string | null;
};

function num(v: number | string): number {
  return Number(v);
}

function isWithinHours(iso: string, hours: number): boolean {
  return Date.now() - new Date(iso).getTime() < hours * 3_600_000;
}

function formatChartLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function loadUserNamesById(): Promise<Map<string, string>> {
  const supabase = getServiceClient();
  const names = new Map<string, string>();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) break;
    for (const user of data.users) {
      const fullName = user.user_metadata?.full_name;
      if (typeof fullName === "string" && fullName.trim()) {
        names.set(user.id, fullName.trim());
      }
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  return names;
}

function mapAdvertiser(
  row: AdvertiserRow,
  displayName?: string
): AdminAdvertiser {
  const email = row.email;
  const company =
    (row.company_name as string | null)?.trim() ||
    (row.invoice_company_name as string | null)?.trim() ||
    email.split("@")[1] ||
    email;
  const name = displayName || email.split("@")[0] || email;

  return {
    id: row.id,
    name,
    email,
    company,
    status: row.status === "suspended" ? "suspended" : "active",
    wallet_balance: num(row.wallet_balance),
    created_at: row.created_at,
    billing: {
      company_name: (row.invoice_company_name as string) ?? "",
      email: (row.invoice_email as string) ?? email,
      vat_number: (row.invoice_vat_number as string) ?? "",
      address_line1: (row.invoice_address_line1 as string) ?? "",
      address_line2: (row.invoice_address_line2 as string) ?? "",
      city: (row.invoice_city as string) ?? "",
      postal_code: (row.invoice_postal_code as string) ?? "",
      country: (row.invoice_country as string) ?? "NL",
    },
  };
}

async function loadAdvertiserMap(): Promise<Map<string, AdminAdvertiser>> {
  const supabase = getServiceClient();
  const [names, { data: rows, error }] = await Promise.all([
    loadUserNamesById(),
    supabase.from("advertisers").select("*").order("created_at", { ascending: false }),
  ]);

  if (error || !rows) return new Map();

  return new Map(
    (rows as AdvertiserRow[]).map((row) => [
      row.id,
      mapAdvertiser(row, names.get(row.id)),
    ])
  );
}

function attachAdvertiser(
  campaign: ReturnType<typeof buildCampaignWithMetrics>,
  advertiser: AdminAdvertiser
): AdminCampaignRow {
  const revenue = estimateRevenue(campaign);
  return {
    ...campaign,
    advertiser,
    revenue,
    roas: estimateRoas(campaign),
  };
}

export async function loadAdminCampaigns(): Promise<AdminCampaignRow[]> {
  const supabase = getServiceClient();
  const advertiserMap = await loadAdvertiserMap();

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !campaigns?.length) return [];

  const campaignIds = campaigns.map((c) => c.id);

  const [{ data: ads }, { data: clicks }] = await Promise.all([
    supabase.from("ads").select("*").in("campaign_id", campaignIds),
    supabase
      .from("clicks")
      .select("campaign_id, ad_id, click_id, cost")
      .in("campaign_id", campaignIds),
  ]);

  const clickIds = (clicks ?? []).map((c) => c.click_id);
  const { data: conversions } = clickIds.length
    ? await supabase
        .from("conversions")
        .select("click_id, value")
        .in("click_id", clickIds)
    : { data: [] as { click_id: string; value: number | string }[] };

  const adsByCampaign = new Map<string, typeof ads>();
  for (const ad of ads ?? []) {
    const list = adsByCampaign.get(ad.campaign_id) ?? [];
    list.push(ad);
    adsByCampaign.set(ad.campaign_id, list);
  }

  const clicksByCampaign = new Map<string, typeof clicks>();
  for (const click of clicks ?? []) {
    const list = clicksByCampaign.get(click.campaign_id) ?? [];
    list.push(click);
    clicksByCampaign.set(click.campaign_id, list);
  }

  return (campaigns as Campaign[]).flatMap((campaign) => {
    const advertiser = advertiserMap.get(campaign.advertiser_id);
    if (!advertiser) return [];

    const withMetrics = buildCampaignWithMetrics(
      campaign,
      adsByCampaign.get(campaign.id) ?? [],
      clicksByCampaign.get(campaign.id) ?? [],
      conversions ?? []
    );

    return [attachAdvertiser(withMetrics, advertiser)];
  });
}

export async function loadAdminPlatformTotals(): Promise<AdminPlatformTotals> {
  const [campaigns, clickLogs, postbackLogs, advertiserMap] = await Promise.all([
    loadAdminCampaigns(),
    loadAdminClickLogs(),
    loadAdminPostbackLogs(),
    loadAdvertiserMap(),
  ]);

  const spend = campaigns.reduce((s, c) => s + c.metrics.spend, 0);
  const clicks = campaigns.reduce((s, c) => s + c.metrics.clicks, 0);
  const conversions = campaigns.reduce((s, c) => s + c.metrics.conversions, 0);
  const revenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const impressions = campaigns.reduce(
    (s, c) => s + c.ads.reduce((a, ad) => a + ad.metrics.impressions, 0),
    0
  );

  return {
    spend,
    clicks,
    conversions,
    revenue,
    roas: spend > 0 ? revenue / spend : 0,
    cpa: conversions > 0 ? spend / conversions : 0,
    ctr: impressions > 0 ? clicks / impressions : 0,
    activeCampaigns: campaigns.filter(
      (c) => c.on_off && c.status !== "rejected"
    ).length,
    totalCampaigns: campaigns.length,
    advertisers: advertiserMap.size,
    postbacks24h: postbackLogs.filter((p) => isWithinHours(p.created_at, 24))
      .length,
    clicks24h: clickLogs.filter((c) => isWithinHours(c.created_at, 24)).length,
  };
}

export async function loadAdminChartData(days = 14): Promise<AdminChartPoint[]> {
  const supabase = getServiceClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const [{ data: clicks }, { data: conversions }] = await Promise.all([
    supabase
      .from("clicks")
      .select("cost, created_at, click_id")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true }),
    supabase
      .from("conversions")
      .select("click_id, value, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true }),
  ]);

  const series = buildTimeSeries(
    (clicks ?? []).map((c) => ({
      cost: num(c.cost),
      created_at: c.created_at as string,
    })),
    (conversions ?? []).map((c) => ({
      click_id: c.click_id as string,
      value: num(c.value),
      created_at: c.created_at as string,
    })),
    days
  );

  return series.map((row) => ({
    date: row.date,
    spend: row.spend,
    clicks: row.clicks,
    conversions: row.conversions,
    label: formatChartLabel(row.date),
  }));
}

export async function loadAdminClickLogs(limit = 500): Promise<ClickLog[]> {
  const supabase = getServiceClient();

  const { data: clicks, error } = await supabase
    .from("clicks")
    .select(
      `
      id,
      created_at,
      click_id,
      campaign_id,
      ad_id,
      cost,
      widget_url,
      page,
      intent_product,
      product_choose,
      product_selection,
      geo_country,
      placement,
      publisher_id,
      publishers ( company_name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !clicks?.length) return [];

  const campaignIds = [...new Set(clicks.map((c) => c.campaign_id as string))];
  const adIds = [
    ...new Set(
      clicks.map((c) => c.ad_id as string | null).filter(Boolean) as string[]
    ),
  ];

  const [{ data: campaigns }, { data: ads }, { data: conversions }] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("id, name, advertiser_id")
        .in("id", campaignIds),
      adIds.length
        ? supabase.from("ads").select("id, name").in("id", adIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      supabase
        .from("conversions")
        .select("click_id")
        .in(
          "click_id",
          clicks.map((c) => c.click_id as string)
        ),
    ]);

  const advertiserMap = await loadAdvertiserMap();
  const campaignById = new Map(
    (campaigns ?? []).map((c) => [c.id as string, c])
  );
  const adById = new Map((ads ?? []).map((a) => [a.id as string, a]));
  const convertedClicks = new Set(
    (conversions ?? []).map((c) => c.click_id as string)
  );

  return clicks.map((click) => {
    const campaign = campaignById.get(click.campaign_id as string);
    const ad = click.ad_id ? adById.get(click.ad_id as string) : undefined;
    const advertiser = campaign
      ? advertiserMap.get(campaign.advertiser_id as string)
      : undefined;
    const pubRaw = click.publishers;
    const publisher = Array.isArray(pubRaw)
      ? (pubRaw[0] as { company_name: string } | undefined)
      : (pubRaw as { company_name: string } | null);
    let selection: string[] = [];
    if (Array.isArray(click.product_selection)) {
      selection = click.product_selection.map((x) => String(x));
    }

    return {
      id: click.id as string,
      created_at: click.created_at as string,
      click_id: click.click_id as string,
      campaign_id: click.campaign_id as string,
      campaign_name: (campaign?.name as string) ?? "—",
      ad_id: (click.ad_id as string) ?? "",
      ad_name: (ad?.name as string) ?? "—",
      advertiser_email: advertiser?.email ?? "—",
      cost: num(click.cost),
      country: (click.geo_country as string) ?? "—",
      device: "",
      converted: convertedClicks.has(click.click_id as string),
      traffic_partner: publisher?.company_name ?? "—",
      page: (click.page as string) ?? "—",
      intent_product: (click.intent_product as string) ?? "—",
      product_choose: (click.product_choose as string) ?? "—",
      product_selection: selection,
      placement: (click.placement as string) ?? "—",
      widget_url: (click.widget_url as string) ?? "",
    };
  });
}

export async function loadAdminPostbackLogs(limit = 500): Promise<PostbackLog[]> {
  const supabase = getServiceClient();

  const { data: conversions, error } = await supabase
    .from("conversions")
    .select("id, created_at, click_id, event, value")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !conversions?.length) return [];

  const clickIds = conversions.map((c) => c.click_id as string);

  const { data: clicks } = await supabase
    .from("clicks")
    .select(
      `
      click_id,
      created_at,
      campaign_id,
      ad_id,
      widget_url,
      page,
      intent_product,
      product_choose,
      product_selection,
      geo_country,
      placement,
      publisher_id,
      publishers ( company_name )
    `
    )
    .in("click_id", clickIds);

  const campaignIds = [
    ...new Set((clicks ?? []).map((c) => c.campaign_id as string)),
  ];
  const adIds = [
    ...new Set(
      (clicks ?? []).map((c) => c.ad_id as string | null).filter(Boolean) as string[]
    ),
  ];

  const [{ data: campaigns }, { data: ads }] = await Promise.all([
    campaignIds.length
      ? supabase.from("campaigns").select("id, name, advertiser_id").in("id", campaignIds)
      : Promise.resolve({ data: [] }),
    adIds.length
      ? supabase.from("ads").select("id, name").in("id", adIds)
      : Promise.resolve({ data: [] }),
  ]);

  const advertiserMap = await loadAdvertiserMap();
  const clickByClickId = new Map(
    (clicks ?? []).map((c) => [c.click_id as string, c])
  );
  const campaignById = new Map(
    (campaigns ?? []).map((c) => [c.id as string, c])
  );
  const adById = new Map((ads ?? []).map((a) => [a.id as string, a]));

  return conversions.map((conv) => {
    const click = clickByClickId.get(conv.click_id as string);
    const campaign = click
      ? campaignById.get(click.campaign_id as string)
      : undefined;
    const ad = click?.ad_id ? adById.get(click.ad_id as string) : undefined;
    const advertiser = campaign
      ? advertiserMap.get(campaign.advertiser_id as string)
      : undefined;
    const pubRaw = click?.publishers;
    const publisher = pubRaw
      ? Array.isArray(pubRaw)
        ? (pubRaw[0] as { company_name: string } | undefined)
        : (pubRaw as { company_name: string })
      : undefined;
    let selection: string[] = [];
    if (click && Array.isArray(click.product_selection)) {
      selection = click.product_selection.map((x) => String(x));
    }

    return {
      id: conv.id as string,
      created_at: conv.created_at as string,
      click_id: conv.click_id as string,
      click_created_at: (click?.created_at as string) ?? "",
      campaign_id: (campaign?.id as string) ?? "",
      campaign_name: (campaign?.name as string) ?? "—",
      ad_name: (ad?.name as string) ?? "—",
      advertiser_email: advertiser?.email ?? "—",
      event: (conv.event as string) ?? "conversion",
      value: num(conv.value),
      status: "success" as const,
      http_status: 200,
      latency_ms: 0,
      traffic_partner: publisher?.company_name ?? "—",
      page: (click?.page as string) ?? "—",
      intent_product: (click?.intent_product as string) ?? "—",
      product_choose: (click?.product_choose as string) ?? "—",
      product_selection: selection,
      placement: (click?.placement as string) ?? "—",
      country: (click?.geo_country as string) ?? "—",
      widget_url: (click?.widget_url as string) ?? "",
    };
  });
}

export async function loadAdminAdvertisers(): Promise<AdminAdvertiser[]> {
  const map = await loadAdvertiserMap();
  return [...map.values()];
}

export async function getAdminAdvertiser(
  id: string
): Promise<AdminAdvertiser | null> {
  const supabase = getServiceClient();
  const [names, { data, error }] = await Promise.all([
    loadUserNamesById(),
    supabase.from("advertisers").select("*").eq("id", id).maybeSingle(),
  ]);

  if (error || !data) return null;
  return mapAdvertiser(data as AdvertiserRow, names.get(id));
}

export async function getAdminAdvertiserInvoices(
  advertiserId: string
): Promise<AdminInvoice[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("advertiser_id", advertiserId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    advertiser_id: row.advertiser_id as string,
    invoice_number: row.invoice_number as string,
    period_start: row.period_start as string,
    period_end: row.period_end as string,
    amount: num(row.amount),
    status: row.status as AdminInvoice["status"],
    created_at: row.created_at as string,
  }));
}

export async function getAdminAdvertiserCampaigns(
  advertiserId: string
): Promise<AdminCampaignRow[]> {
  const campaigns = await loadAdminCampaigns();
  return campaigns.filter((c) => c.advertiser_id === advertiserId);
}

export async function loadAdminAdvertiserRows() {
  const [advertisers, campaigns] = await Promise.all([
    loadAdminAdvertisers(),
    loadAdminCampaigns(),
  ]);

  return advertisers.map((a) => {
    const advCampaigns = campaigns.filter((c) => c.advertiser_id === a.id);
    const spend = advCampaigns.reduce((s, c) => s + c.metrics.spend, 0);
    const active = advCampaigns.filter(
      (c) => c.on_off && c.status !== "rejected"
    ).length;
    return {
      ...a,
      campaigns: advCampaigns.length,
      spend,
      active,
    };
  });
}

export interface AdminOverviewData {
  totals: AdminPlatformTotals;
  chartData: AdminChartPoint[];
  topCampaigns: AdminCampaignRow[];
  recentClicks: ClickLog[];
  recentPostbacks: PostbackLog[];
}

export async function loadAdminPublishers(): Promise<
  import("@/lib/admin-types").AdminPublisher[]
> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("publishers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    company_name: (row.company_name as string) ?? "",
    contact_email: (row.contact_email as string) ?? "",
    status: row.status === "suspended" ? "suspended" : "active",
    created_at: row.created_at as string,
  }));
}

export async function getAdminPublisher(
  id: string
): Promise<import("@/lib/admin-types").AdminPublisher | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("publishers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    company_name: (data.company_name as string) ?? "",
    contact_email: (data.contact_email as string) ?? "",
    status: data.status === "suspended" ? "suspended" : "active",
    created_at: data.created_at as string,
  };
}

export async function loadAdminOverviewData(): Promise<AdminOverviewData> {
  const [totals, chartData, campaigns, recentClicks, recentPostbacks] =
    await Promise.all([
      loadAdminPlatformTotals(),
      loadAdminChartData(),
      loadAdminCampaigns(),
      loadAdminClickLogs(8),
      loadAdminPostbackLogs(8),
    ]);

  const topCampaigns = [...campaigns]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totals,
    chartData,
    topCampaigns,
    recentClicks,
    recentPostbacks,
  };
}
