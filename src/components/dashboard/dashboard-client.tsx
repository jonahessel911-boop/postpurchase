"use client";

import { useMemo, useState } from "react";
import { MetricCard, PageHeader } from "@/components/ui";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { SpendChart } from "@/components/dashboard/spend-chart";
import { CampaignTable } from "@/components/dashboard/campaign-table";
import { buildDashboardData } from "@/lib/api/dashboard";
import type { AdvertiserMetricsSnapshot } from "@/lib/metrics-from-snapshot";
import type { DateRangePreset } from "@/lib/date-range";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function DashboardClient({
  snapshot,
}: {
  snapshot: AdvertiserMetricsSnapshot;
}) {
  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");

  const data = useMemo(
    () => buildDashboardData(snapshot, dateRange),
    [snapshot, dateRange]
  );

  const { totals, chartStream, sparklines, campaigns } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        action={
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Spend"
          value={formatCurrency(totals.spend)}
          sparkline={sparklines.spend}
        />
        <MetricCard
          label="Clicks to site"
          value={formatNumber(totals.clicks)}
          sparkline={sparklines.clicks}
        />
        <MetricCard
          label="Avg CpC"
          value={formatCurrency(totals.cpc)}
          sparkline={sparklines.cpc}
        />
        <MetricCard
          label="Conversions"
          value={formatNumber(totals.conversions)}
          sparkline={sparklines.conversions}
        />
        <MetricCard
          label="CPA"
          value={formatCurrency(totals.cpa)}
          sparkline={sparklines.cpa}
        />
      </div>

      <SpendChart
        clicks={chartStream.clicks}
        conversions={chartStream.conversions}
        datePreset={dateRange}
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold">Campaigns</h2>
        <CampaignTable campaigns={campaigns} />
      </div>
    </div>
  );
}
