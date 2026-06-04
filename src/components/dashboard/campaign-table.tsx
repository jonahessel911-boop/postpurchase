"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toggle, Button } from "@/components/ui";
import { MetaStatusBadge } from "@/components/campaigns/meta-badge";
import { MediaPreview } from "@/components/campaigns/media-preview";
import { createAdPath } from "@/lib/campaign-create-ad";
import {
  duplicateCampaignAd,
  updateAdActive,
  updateCampaignOnOff,
} from "@/lib/api/campaign-actions";
import { emptyAdWithMetrics } from "@/lib/api/compute-metrics";
import { publishedAds, trafficSharePercent } from "@/lib/ads";
import { isAdDelivering, isCampaignOn, isCampaignRejected } from "@/lib/campaign-status";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import type { CampaignWithMetrics } from "@/lib/campaign-types";
import type { AdWithMetrics } from "@/lib/types";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";

const METRIC_HEADERS = [
  "Spend",
  "Clicks",
  "CPC",
  "CTR",
  "Conv.",
  "CPA",
] as const;

export function CampaignTable({
  campaigns: initial,
}: {
  campaigns: CampaignWithMetrics[];
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initial);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busyAd, setBusyAd] = useState<string | null>(null);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCreateAd(campaign: CampaignWithMetrics) {
    router.push(createAdPath(campaign.id));
  }

  async function handleDuplicateAd(
    campaignId: string,
    sourceAd: AdWithMetrics
  ) {
    setBusyAd(sourceAd.id);
    try {
      const newAd = await duplicateCampaignAd(campaignId, sourceAd.id);
      const withMetrics = emptyAdWithMetrics(newAd);
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? { ...c, ads: [...c.ads, withMetrics] }
            : c
        )
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to duplicate ad");
    } finally {
      setBusyAd(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <table className="w-full min-w-[900px] table-fixed border-collapse text-left text-[13px]">
        <colgroup>
          <col className="w-[72px]" />
          <col />
          <col className="w-[148px]" />
          <col className="w-[88px]" />
          <col className="w-[72px]" />
          <col className="w-[72px]" />
          <col className="w-[64px]" />
          <col className="w-[64px]" />
          <col className="w-[72px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted">
            <th className="px-5 py-3.5">On</th>
            <th className="px-5 py-3.5">Campaign</th>
            <th className="px-5 py-3.5">Status</th>
            {METRIC_HEADERS.map((h) => (
              <th key={h} className="px-5 py-3.5 text-right">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => {
            const isOpen = expanded.has(c.id);
            const liveAds = publishedAds(c.ads);
            const activeAds = liveAds.filter((a) => a.active).length;
            const share = trafficSharePercent(liveAds);
            const canToggleAds = isCampaignOn(c);

            return (
              <CampaignRows
                key={c.id}
                campaign={c}
                isOpen={isOpen}
                activeAds={activeAds}
                share={share}
                canToggleAds={canToggleAds}
                busyAd={busyAd}
                onToggleExpand={() => toggleExpanded(c.id)}
                onCampaignOnOff={async (onOff) => {
                  await updateCampaignOnOff(c.id, onOff);
                  setCampaigns((prev) =>
                    prev.map((x) =>
                      x.id === c.id ? { ...x, on_off: onOff } : x
                    )
                  );
                }}
                onAdActive={async (adId, active) => {
                  await updateAdActive(adId, active);
                  setCampaigns((prev) =>
                    prev.map((x) =>
                      x.id === c.id
                        ? {
                            ...x,
                            ads: x.ads.map((a) =>
                              a.id === adId ? { ...a, active } : a
                            ),
                          }
                        : x
                    )
                  );
                }}
                onCreateAd={() => handleCreateAd(c)}
                onDuplicateAd={(ad) => handleDuplicateAd(c.id, ad)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CampaignRows({
  campaign: c,
  isOpen,
  activeAds,
  share,
  canToggleAds,
  busyAd,
  onToggleExpand,
  onCampaignOnOff,
  onAdActive,
  onCreateAd,
  onDuplicateAd,
}: {
  campaign: CampaignWithMetrics;
  isOpen: boolean;
  activeAds: number;
  share: number;
  canToggleAds: boolean;
  busyAd: string | null;
  onToggleExpand: () => void;
  onCampaignOnOff: (onOff: boolean) => void;
  onAdActive: (adId: string, active: boolean) => void;
  onCreateAd: () => void;
  onDuplicateAd: (ad: AdWithMetrics) => void;
}) {
  return (
    <>
      <tr className="border-b border-border align-top transition-colors hover:bg-zinc-50/80">
        <td className="px-5 py-3.5 align-middle">
          <Toggle
            checked={c.on_off}
            disabled={isCampaignRejected(c.status)}
            onChange={onCampaignOnOff}
          />
        </td>
        <td className="px-5 py-3.5">
          <Link
            href={`/campaigns/${c.id}`}
            className="font-medium hover:text-accent"
          >
            {c.name}
          </Link>
          <button
            type="button"
            onClick={onToggleExpand}
            className="mt-1 flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {publishedAds(c.ads).length} ad
            {publishedAds(c.ads).length !== 1 ? "s" : ""}
            {activeAds > 0 ? ` · ${activeAds} active` : ""}
          </button>
        </td>
        <td className="px-5 py-3.5 align-middle">
          <div className="flex items-center gap-2">
            <Link
              href={`/campaigns/${c.id}/edit`}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-accent/90"
              title="Edit campaign"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <MetaStatusBadge status={c.status} onOff={c.on_off} />
          </div>
        </td>
        <MetricCells metrics={c.metrics} conversions={c.metrics.conversions} />
      </tr>

      {isOpen ? (
        <>
          <tr className="border-b border-border/60 bg-zinc-50/90">
            <td colSpan={3} className="px-5 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-muted">
                  {activeAds} active ad{activeAds !== 1 ? "s" : ""}
                  {share > 0
                    ? ` · ${formatNumber(share, 1)}% traffic each`
                    : ""}
                </p>
                <Button
                  type="button"
                  className="h-7 gap-1 bg-accent px-2.5 text-[11px] text-white hover:bg-[#4f3fe0]"
                  onClick={onCreateAd}
                >
                  <Plus className="h-3 w-3" />
                  Create ad
                </Button>
              </div>
            </td>
            <td colSpan={6} className="border-b border-border/60 bg-zinc-50/90" />
          </tr>
          {publishedAds(c.ads).map((ad) => (
            <tr
              key={ad.id}
              className="border-b border-border/40 bg-zinc-50/70 last:border-border"
            >
              <td className="px-5 py-2.5 align-middle">
                <Toggle
                  checked={ad.active}
                  disabled={!canToggleAds}
                  onChange={(v) => onAdActive(ad.id, v)}
                />
              </td>
              <td className="px-5 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5 pl-4">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded border border-zinc-200/80 bg-white">
                    <MediaPreview
                      url={ad.media_url}
                      mediaType={ad.media_type}
                      alt={ad.name}
                      fill
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/campaigns/${c.id}/edit?ad=${ad.id}`}
                      className="block truncate text-[12px] font-medium text-foreground hover:text-accent"
                    >
                      {ad.name}
                    </Link>
                    {ad.title ? (
                      <p className="truncate text-[10px] text-muted">
                        {ad.title}
                      </p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-5 py-2.5 align-middle">
                <div className="flex items-center justify-start gap-0.5">
                  <button
                    type="button"
                    title="Duplicate"
                    disabled={busyAd === ad.id}
                    onClick={() => onDuplicateAd(ad)}
                    className="rounded p-1 text-zinc-400 hover:bg-white hover:text-zinc-700"
                  >
                    {busyAd === ad.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <Link
                    href={`/campaigns/${c.id}/edit?ad=${ad.id}`}
                    className="rounded p-1 text-zinc-400 hover:bg-white hover:text-zinc-700"
                    title="Edit ad"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </td>
              <MetricCells
                metrics={ad.metrics}
                conversions={ad.metrics.conversions}
                small
              />
            </tr>
          ))}
        </>
      ) : null}
    </>
  );
}

function MetricCells({
  metrics,
  conversions,
  small,
}: {
  metrics: {
    spend: number;
    clicks: number;
    cpc: number;
    ctr: number;
    cpa: number;
  };
  conversions: number;
  small?: boolean;
}) {
  const py = small ? "py-2.5" : "py-3.5";
  const text = small ? "text-[11px]" : "text-xs";

  return (
    <>
      <td className={cn("px-5 text-right font-mono align-middle", py, text)}>
        {formatCurrency(metrics.spend)}
      </td>
      <td className={cn("px-5 text-right font-mono align-middle", py, text)}>
        {formatNumber(metrics.clicks)}
      </td>
      <td className={cn("px-5 text-right font-mono align-middle", py, text)}>
        {formatCurrency(metrics.cpc)}
      </td>
      <td className={cn("px-5 text-right font-mono align-middle", py, text)}>
        {formatNumber(metrics.ctr * 100, 1)}%
      </td>
      <td className={cn("px-5 text-right font-mono align-middle", py, text)}>
        {formatNumber(conversions)}
      </td>
      <td className={cn("px-5 text-right font-mono align-middle", py, text)}>
        {conversions > 0 ? formatCurrency(metrics.cpa) : "—"}
      </td>
    </>
  );
}
