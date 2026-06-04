"use client";

import { useMemo, useState } from "react";
import { MetricCard, PageHeader } from "@/components/ui";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { PublisherStatsChart } from "@/components/publisher/publisher-stats-chart";
import {
  buildPublisherDashboardData,
  type PublisherMetricsSnapshot,
} from "@/lib/publisher-metrics";
import type { DateRangePreset } from "@/lib/date-range";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

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

      <PublisherStatsChart snapshot={snapshot} datePreset={dateRange} />
    </div>
  );
}
