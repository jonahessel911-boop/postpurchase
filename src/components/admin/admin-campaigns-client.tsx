"use client";

import { useMemo, useState } from "react";
import { MetaStatusBadge } from "@/components/campaigns/meta-badge";
import { KpiStrip } from "@/components/campaigns/kpi-strip";
import type { AdminCampaignRow, AdminPlatformTotals } from "@/lib/admin-types";
import { campaignDisplayId } from "@/lib/campaign-table-utils";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { Search } from "lucide-react";

export function AdminCampaignsClient({
  campaigns,
  totals,
}: {
  campaigns: AdminCampaignRow[];
  totals: AdminPlatformTotals;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const q = search.toLowerCase();
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.advertiser.company.toLowerCase().includes(q) &&
        !c.advertiser.email.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (statusFilter === "active") return c.on_off && c.status !== "rejected";
      if (statusFilter === "paused")
        return !c.on_off && c.status !== "rejected";
      if (statusFilter === "rejected") return c.status === "rejected";
      return true;
    });
  }, [campaigns, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          All campaigns
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          {filtered.length} campaigns across {totals.advertisers} advertisers
        </p>
      </div>

      <KpiStrip
        items={[
          { label: "Total spend", value: formatCurrency(totals.spend) },
          { label: "Clicks", value: formatNumber(totals.clicks) },
          { label: "CTR", value: `${formatNumber(totals.ctr * 100, 2)}%` },
          { label: "Conversions", value: formatNumber(totals.conversions) },
          { label: "Revenue", value: formatCurrency(totals.revenue), highlight: true },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search campaigns, advertisers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-[13px] outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-muted">
            No campaigns match your filters
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-[13px]">
              <thead className="border-b border-border bg-zinc-50/80">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-2.5">Campaign</th>
                  <th className="px-4 py-2.5">Advertiser</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Spend</th>
                  <th className="px-4 py-2.5 text-right">Clicks</th>
                  <th className="px-4 py-2.5 text-right">CTR</th>
                  <th className="px-4 py-2.5 text-right">Conv.</th>
                  <th className="px-4 py-2.5 text-right">CPA</th>
                  <th className="px-4 py-2.5 text-right">Revenue</th>
                  <th className="px-4 py-2.5 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <CampaignRow key={c.id} campaign={c} zebra={i % 2 === 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignRow({
  campaign: c,
  zebra,
}: {
  campaign: AdminCampaignRow;
  zebra: boolean;
}) {
  return (
    <tr
      className={cn(
        "border-b border-border hover:bg-violet-50",
        zebra && "bg-zinc-50/50"
      )}
    >
      <td className="px-4 py-3">
        <p className="font-medium text-foreground">{c.name}</p>
        <p className="mt-0.5 text-[11px] text-zinc-400">
          {campaignDisplayId(c.id)} · {c.ads.length} ads
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-foreground">{c.advertiser.company}</p>
        <p className="text-[11px] text-zinc-400">{c.advertiser.email}</p>
      </td>
      <td className="px-4 py-3">
        <MetaStatusBadge status={c.status} onOff={c.on_off} />
      </td>
      <td className="px-4 py-3 text-right font-mono">
        {formatCurrency(c.metrics.spend)}
      </td>
      <td className="px-4 py-3 text-right font-mono">
        {formatNumber(c.metrics.clicks)}
      </td>
      <td className="px-4 py-3 text-right font-mono text-muted">
        {formatNumber(c.metrics.ctr * 100, 1)}%
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold">
        {formatNumber(c.metrics.conversions)}
      </td>
      <td className="px-4 py-3 text-right font-mono">
        {c.metrics.conversions > 0
          ? formatCurrency(c.metrics.cpa)
          : "—"}
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold">
        {formatCurrency(c.revenue)}
      </td>
      <td className="px-4 py-3 text-right font-mono text-accent">
        {formatNumber(c.roas, 1)}×
      </td>
    </tr>
  );
}
