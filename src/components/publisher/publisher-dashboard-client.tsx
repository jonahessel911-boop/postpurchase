"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MetricCard, PageHeader } from "@/components/ui";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  buildPublisherDashboardData,
  type PublisherMetricsSnapshot,
} from "@/lib/publisher-metrics";
import type { DateRangePreset } from "@/lib/date-range";
import { PUBLISHER_REVENUE_SHARE } from "@/lib/publisher-revenue";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { Plus } from "lucide-react";

export function PublisherDashboardClient({
  snapshot,
}: {
  snapshot: PublisherMetricsSnapshot;
}) {
  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");

  const data = useMemo(
    () => buildPublisherDashboardData(snapshot, dateRange),
    [snapshot, dateRange]
  );

  const { totals, sparklines } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        action={
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
        <MetricCard
          label="Clicks"
          value={formatNumber(totals.clicks)}
          sparkline={sparklines.clicks}
        />
        <MetricCard
          label="Revenue"
          value={formatCurrency(totals.revenue)}
          sparkline={sparklines.revenue}
        />
        <MetricCard
          label="CTR"
          value={formatPercent(totals.ctr)}
          sparkline={sparklines.ctr}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Your integration</h2>
            <p className="mt-1 text-[13px] text-muted">
              Revenue is {Math.round(PUBLISHER_REVENUE_SHARE * 100)}% of
              advertiser CPC on your traffic. CTR = clicks ÷ offers shown (
              {formatNumber(totals.offersShown)} page loads). One traffic
              partner id — paste redirect, popup, or native code on your site.
            </p>
          </div>
          <Link
            href="/publisher/manager"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-[13px] font-medium text-white hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Get install code
          </Link>
        </div>
        <Link
          href="/publisher/manager"
          className="mt-4 inline-block text-[13px] font-medium text-accent hover:underline"
        >
          Open Integration →
        </Link>
      </div>
    </div>
  );
}
