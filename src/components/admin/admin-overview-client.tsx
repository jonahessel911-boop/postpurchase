"use client";

import Link from "next/link";
import { MetricCard, PageHeader, DateRangePicker } from "@/components/ui";
import { SpendChart } from "@/components/dashboard/spend-chart";
import { MetaStatusBadge } from "@/components/campaigns/meta-badge";
import { formatLogTime } from "@/lib/admin-types";
import type { AdminOverviewData } from "@/lib/api/admin-server";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

function StatusDot({ status }: { status: string }) {
  const dot: Record<string, string> = {
    success: "bg-emerald-500",
    failed: "bg-red-500",
    duplicate: "bg-amber-400",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] capitalize text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status] ?? "bg-zinc-400"}`} />
      {status}
    </span>
  );
}

export function AdminOverviewClient({ data }: { data: AdminOverviewData }) {
  const { totals, chartData, topCampaigns, recentClicks, recentPostbacks } =
    data;
  const avgCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const spendChartData = chartData.map(({ label, spend }) => ({ label, spend }));

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Platform overview"
        action={<DateRangePicker />}
      />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Spend" value={formatCurrency(totals.spend)} />
        <MetricCard
          label="Clicks to site"
          value={formatNumber(totals.clicks)}
        />
        <MetricCard label="Avg CpC" value={formatCurrency(avgCpc)} />
        <MetricCard
          label="Conversions"
          value={formatNumber(totals.conversions)}
        />
        <MetricCard label="CPA" value={formatCurrency(totals.cpa)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Advertisers", value: formatNumber(totals.advertisers) },
          { label: "Active campaigns", value: formatNumber(totals.activeCampaigns) },
          { label: "Clicks (24h)", value: formatNumber(totals.clicks24h) },
          { label: "Postbacks (24h)", value: formatNumber(totals.postbacks24h) },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {item.label}
            </p>
            <p className="mt-1 font-mono text-base font-semibold text-foreground sm:text-[16px]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <SpendChart data={spendChartData} />

      <div className="grid gap-6 lg:grid-cols-2">
        <LogPanel
          title="Recent postbacks"
          href="/admin/postbacks"
          headers={["Time", "Campaign", "Event", "Value", "Status"]}
          rows={recentPostbacks.map((p) => [
            formatLogTime(p.created_at),
            p.campaign_name,
            p.event,
            formatCurrency(p.value),
            <StatusDot key={p.id} status={p.status} />,
          ])}
          emptyMessage="No conversions recorded yet"
        />
        <LogPanel
          title="Recent clicks"
          href="/admin/clicks"
          headers={["Time", "Campaign", "Ad", "Cost", "Conv."]}
          rows={recentClicks.map((c) => [
            formatLogTime(c.created_at),
            c.campaign_name,
            c.ad_name,
            formatCurrency(c.cost),
            c.converted ? "Yes" : "—",
          ])}
          emptyMessage="No clicks recorded yet"
        />
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold">Top campaigns</h2>
          <Link
            href="/admin/campaigns"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {topCampaigns.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted">
              No campaigns yet
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5">Campaign</th>
                  <th className="px-4 py-2.5">Advertiser</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Spend</th>
                  <th className="px-4 py-2.5 text-right">Conv.</th>
                  <th className="px-4 py-2.5 text-right">CPA</th>
                </tr>
              </thead>
              <tbody>
                {topCampaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-zinc-50/80"
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {c.name}
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {c.advertiser.company}
                    </td>
                    <td className="px-4 py-2.5">
                      <MetaStatusBadge status={c.status} onOff={c.on_off} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {formatCurrency(c.metrics.spend)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {formatNumber(c.metrics.conversions)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {c.metrics.conversions > 0
                        ? formatCurrency(c.metrics.cpa)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function LogPanel({
  title,
  href,
  headers,
  rows,
  emptyMessage,
}: {
  title: string;
  href: string;
  headers: string[];
  rows: (string | React.ReactNode)[][];
  emptyMessage: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-muted">
            {emptyMessage}
          </p>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wide text-muted">
                {headers.map((h) => (
                  <th key={h} className="px-3 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-muted">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
