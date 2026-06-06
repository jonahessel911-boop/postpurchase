"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Toggle } from "@/components/ui";
import { MetaStatusBadge } from "@/components/campaigns/meta-badge";
import { CampaignKpiStrip } from "@/components/campaigns/compact-stats-bar";
import { CampaignServerTrackingStatus } from "@/components/campaigns/campaign-server-tracking-status";
import { MetricCell } from "@/components/campaigns/metric-cell";
import { MediaPreview } from "@/components/campaigns/media-preview";
import {
  AdsManagerTable,
  type ColumnDef,
} from "@/components/campaigns/ads-manager-table";
import { emptyAdWithMetrics } from "@/lib/api/compute-metrics";
import { createAdPath } from "@/lib/campaign-create-ad";
import { publishedAds } from "@/lib/ads";
import {
  duplicateCampaignAd,
  updateCampaignOnOff,
  updateAdActive,
} from "@/lib/api/campaign-actions";
import {
  campaignDisplayId,
  formatRelativeUpdated,
} from "@/lib/campaign-table-utils";
import { verticalLabel, type CampaignWithMetrics } from "@/lib/campaign-types";
import type { AdWithMetrics } from "@/lib/types";
import { isCampaignOn, isCampaignRejected } from "@/lib/campaign-status";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Copy,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
} from "lucide-react";

interface CampaignDetailPageProps {
  campaign: CampaignWithMetrics;
}

type AdRow = AdWithMetrics & { id: string };

export function CampaignDetailPage({ campaign: initial }: CampaignDetailPageProps) {
  const router = useRouter();
  const [campaign, setCampaign] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const adRows: AdRow[] = useMemo(
    () =>
      publishedAds(campaign.ads).map((ad) => ({ ...ad, id: ad.id })),
    [campaign.ads]
  );

  const canToggleAds =
    isCampaignOn(campaign);

  function handleCreateAd() {
    router.push(createAdPath(campaign.id));
  }

  async function handleDuplicateAd(ad: AdRow) {
    setBusy(ad.id);
    try {
      const newAd = await duplicateCampaignAd(campaign.id, ad.id);
      const withMetrics = emptyAdWithMetrics(newAd);
      setCampaign((c) => ({
        ...c,
        ads: [...c.ads, withMetrics],
      }));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to duplicate ad");
    } finally {
      setBusy(null);
    }
  }

  const columns: ColumnDef<AdRow>[] = useMemo(
    () => [
      {
        id: "preview",
        header: "",
        width: 56,
        minWidth: 56,
        sticky: true,
        render: (ad) => (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-zinc-200/80 bg-zinc-50">
            <MediaPreview
              url={ad.media_url}
              mediaType={ad.media_type}
              alt={ad.name}
              fill
            />
          </div>
        ),
      },
      {
        id: "name",
        header: "Ad",
        width: 280,
        minWidth: 200,
        sticky: true,
        sortable: true,
        sortValue: (ad) => ad.name,
        render: (ad) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <Toggle
              checked={ad.active}
              disabled={!canToggleAds}
              onChange={async (v) => {
                await updateAdActive(ad.id, v);
                setCampaign((c) => ({
                  ...c,
                  ads: c.ads.map((a) =>
                    a.id === ad.id ? { ...a, active: v } : a
                  ),
                }));
              }}
            />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-zinc-900 group-hover:text-[#5B47FB]">
                {ad.name}
              </p>
              {ad.title ? (
                <p className="truncate text-[11px] text-zinc-500">{ad.title}</p>
              ) : (
                <p className="text-[11px] text-zinc-400">No headline yet</p>
              )}
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 72,
        render: (ad) => (
          <div className="flex items-center justify-end gap-0.5">
            <button
              type="button"
              title="Duplicate ad"
              disabled={busy === ad.id}
              onClick={(e) => {
                e.stopPropagation();
                void handleDuplicateAd(ad);
              }}
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              {busy === ad.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <Link
              href={`/campaigns/${campaign.id}/edit?ad=${ad.id}`}
              onClick={(e) => e.stopPropagation()}
              title="Edit ad"
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
        ),
      },
      {
        id: "spend",
        header: "Spend",
        width: 100,
        align: "right",
        sortable: true,
        sortValue: (ad) => ad.metrics.spend,
        render: (ad) => (
          <MetricCell value={formatCurrency(ad.metrics.spend)} emphasize />
        ),
      },
      {
        id: "clicks",
        header: "Clicks",
        width: 72,
        align: "right",
        sortable: true,
        sortValue: (ad) => ad.metrics.clicks,
        render: (ad) => (
          <MetricCell value={formatNumber(ad.metrics.clicks)} emphasize />
        ),
      },
      {
        id: "ctr",
        header: "CTR",
        width: 72,
        align: "right",
        sortable: true,
        sortValue: (ad) => ad.metrics.ctr,
        render: (ad) => (
          <MetricCell
            value={`${formatNumber(ad.metrics.ctr * 100, 2)}%`}
            emphasize
          />
        ),
      },
      {
        id: "conversions",
        header: "Conv.",
        width: 72,
        align: "right",
        sortable: true,
        sortValue: (ad) => ad.metrics.conversions,
        render: (ad) => (
          <MetricCell
            value={formatNumber(ad.metrics.conversions)}
            emphasize
          />
        ),
      },
      {
        id: "cpa",
        header: "CPA",
        width: 88,
        align: "right",
        sortable: true,
        sortValue: (ad) => ad.metrics.cpa,
        render: (ad) => (
          <MetricCell
            value={
              ad.metrics.conversions > 0
                ? formatCurrency(ad.metrics.cpa)
                : "—"
            }
            emphasize
          />
        ),
      },
    ],
    [campaign.id, canToggleAds, busy]
  );

  const [sortKey, setSortKey] = useState("spend");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sortedAds = useMemo(() => {
    const m = sortDir === "asc" ? 1 : -1;
    return [...adRows].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return m * a.name.localeCompare(b.name);
        case "spend":
          return m * (a.metrics.spend - b.metrics.spend);
        case "clicks":
          return m * (a.metrics.clicks - b.metrics.clicks);
        case "ctr":
          return m * (a.metrics.ctr - b.metrics.ctr);
        case "conversions":
          return m * (a.metrics.conversions - b.metrics.conversions);
        case "cpa":
          return m * (a.metrics.cpa - b.metrics.cpa);
        default:
          return 0;
      }
    });
  }, [adRows, sortKey, sortDir]);

  const liveAds = publishedAds(campaign.ads);
  const activeCount = liveAds.filter((a) => a.active).length;

  const campaignImpressions = campaign.ads.reduce(
    (s, ad) => s + ad.metrics.impressions,
    0
  );
  const campaignCtr =
    campaignImpressions > 0
      ? campaign.metrics.clicks / campaignImpressions
      : campaign.metrics.ctr;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/campaigns"
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All campaigns
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {campaign.name}
            </h1>
            <MetaStatusBadge status={campaign.status} onOff={campaign.on_off} />
          </div>
          <p className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-muted sm:text-[13px]">
            <span>{campaignDisplayId(campaign.id)}</span>
            <span className="hidden text-zinc-300 sm:inline">·</span>
            <span>{verticalLabel(campaign.vertical)}</span>
            <span className="hidden text-zinc-300 sm:inline">·</span>
            <span>Updated {formatRelativeUpdated(campaign.updated_at)}</span>
          </p>
          <CampaignKpiStrip
            className="mt-4 max-w-3xl"
            items={[
              {
                label: "Spend",
                value: formatCurrency(campaign.metrics.spend),
                highlight: true,
              },
              {
                label: "Budget",
                value: formatCurrency(Number(campaign.daily_budget ?? 0)),
              },
              {
                label: "Clicks",
                value: formatNumber(campaign.metrics.clicks),
              },
              {
                label: "CTR",
                value: `${formatNumber(campaignCtr * 100, 2)}%`,
                highlight: true,
              },
              {
                label: "Conversions",
                value: formatNumber(campaign.metrics.conversions),
                highlight: true,
              },
              {
                label: "CPA",
                value:
                  campaign.metrics.conversions > 0
                    ? formatCurrency(campaign.metrics.cpa)
                    : "—",
              },
            ]}
          />
          <CampaignServerTrackingStatus
            lastPostbackAt={campaign.last_postback_at}
            className="mt-3"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start">
          <Toggle
            checked={campaign.on_off}
            disabled={isCampaignRejected(campaign.status)}
            onChange={async (v) => {
              await updateCampaignOnOff(campaign.id, v);
              setCampaign((c) => ({ ...c, on_off: v }));
            }}
          />
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-zinc-50 hover:text-accent"
            title="Edit campaign settings"
            aria-label="Edit campaign settings"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <Button variant="ghost" className="h-9 w-9 rounded-lg p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-foreground">
              Ads in this campaign
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {liveAds.length} ads · {activeCount} active
            </p>
          </div>
          <Button
            type="button"
            className={cn(
              "h-9 gap-1.5 text-[12px]",
              "bg-accent hover:bg-[#4f3fe0] text-white"
            )}
            onClick={handleCreateAd}
          >
            <Plus className="h-4 w-4" />
            Create ad
          </Button>
        </div>

        <AdsManagerTable
          rows={sortedAds}
          columns={columns}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={(key) => {
            if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
            else {
              setSortKey(key);
              setSortDir("desc");
            }
          }}
          selected={selected}
          onSelectRow={(id, checked) => {
            setSelected((s) => {
              const next = new Set(s);
              if (checked) next.add(id);
              else next.delete(id);
              return next;
            });
          }}
          onSelectAll={(checked) => {
            setSelected(
              checked ? new Set(sortedAds.map((a) => a.id)) : new Set()
            );
          }}
          emptyMessage="No ads yet. Create your first ad."
          premium
          onRowClick={(ad) =>
            router.push(`/campaigns/${campaign.id}/edit?ad=${ad.id}`)
          }
        />
      </div>
    </div>
  );
}
