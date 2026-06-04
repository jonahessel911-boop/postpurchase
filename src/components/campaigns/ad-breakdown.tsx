"use client";

import { useState } from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { trafficSharePercent } from "@/lib/ads";
import type { AdWithMetrics } from "@/lib/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui";

interface AdBreakdownProps {
  ads: AdWithMetrics[];
  campaignOn?: boolean;
  onToggleAd?: (adId: string, active: boolean) => void;
  compact?: boolean;
}

export function AdBreakdownTable({
  ads,
  campaignOn = true,
  onToggleAd,
  compact = false,
}: AdBreakdownProps) {
  const share = trafficSharePercent(ads);

  return (
    <div className={cn("overflow-x-auto", compact ? "py-2" : "py-3")}>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[11px] text-muted">
          {ads.filter((a) => a.active).length} active ad
          {ads.filter((a) => a.active).length !== 1 ? "s" : ""} ·{" "}
          {share > 0 ? `${formatNumber(share, 1)}% traffic each` : "No traffic split"}
        </p>
      </div>
      <table className="w-full min-w-[640px] text-left text-[12px]">
        <thead>
          <tr className="text-[10px] font-medium uppercase tracking-wider text-muted">
            {onToggleAd && <th className="pb-2 pr-3 w-10">On</th>}
            <th className="pb-2 pr-4">Ad</th>
            <th className="pb-2 pr-4 text-right">Traffic</th>
            <th className="pb-2 pr-4 text-right">Spend</th>
            <th className="pb-2 pr-4 text-right">Clicks</th>
            <th className="pb-2 pr-4 text-right">CTR</th>
            <th className="pb-2 pr-4 text-right">Conv.</th>
            <th className="pb-2 text-right">CPA</th>
          </tr>
        </thead>
        <tbody>
          {ads.map((ad) => (
            <tr key={ad.id} className="border-t border-border/60">
              {onToggleAd && (
                <td className="py-2.5 pr-3">
                  <Toggle
                    checked={ad.active}
                    disabled={!campaignOn}
                    onChange={(v) => onToggleAd(ad.id, v)}
                  />
                </td>
              )}
              <td className="py-2.5 pr-4">
                <span className="font-medium">{ad.name}</span>
                {!ad.active && (
                  <span className="ml-2 text-[10px] text-muted">(paused)</span>
                )}
              </td>
              <td className="py-2.5 pr-4 text-right font-mono text-[11px]">
                {ad.active ? `${formatNumber(share, 1)}%` : "—"}
              </td>
              <td className="py-2.5 pr-4 text-right font-mono text-[11px]">
                {formatCurrency(ad.metrics.spend)}
              </td>
              <td className="py-2.5 pr-4 text-right font-mono text-[11px]">
                {formatNumber(ad.metrics.clicks)}
              </td>
              <td className="py-2.5 pr-4 text-right font-mono text-[11px]">
                {formatNumber(ad.metrics.ctr * 100, 1)}%
              </td>
              <td className="py-2.5 pr-4 text-right font-mono text-[11px]">
                {formatNumber(ad.metrics.conversions)}
              </td>
              <td className="py-2.5 text-right font-mono text-[11px]">
                {ad.metrics.conversions > 0
                  ? formatCurrency(ad.metrics.cpa)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdBreakdownDropdown({
  ads,
  campaignOn = true,
  onToggleAd,
}: AdBreakdownProps) {
  const [open, setOpen] = useState(false);
  const activeCount = ads.filter((a) => a.active).length;

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        {ads.length} ad{ads.length !== 1 ? "s" : ""}
        {activeCount > 0 && ` · ${activeCount} active`}
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-border bg-background p-3">
          <AdBreakdownTable
            ads={ads}
            campaignOn={campaignOn}
            onToggleAd={onToggleAd}
            compact
          />
        </div>
      )}
    </div>
  );
}
