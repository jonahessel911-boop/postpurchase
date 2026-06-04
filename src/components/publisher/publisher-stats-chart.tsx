"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui";
import type { DateRangePreset } from "@/lib/date-range";
import {
  buildPublisherChartSeries,
  type PublisherChartPoint,
  type PublisherMetricsSnapshot,
} from "@/lib/publisher-metrics";
import {
  CHART_GRANULARITY_OPTIONS,
  defaultGranularityForPreset,
  type ChartGranularity,
} from "@/lib/chart-series";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function PublisherStatsChart({
  snapshot,
  datePreset,
}: {
  snapshot: PublisherMetricsSnapshot;
  datePreset: DateRangePreset;
}) {
  const [granularity, setGranularity] = useState<ChartGranularity>(() =>
    defaultGranularityForPreset(datePreset)
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGranularity(defaultGranularityForPreset(datePreset));
  }, [datePreset]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const chartData = useMemo(
    () => buildPublisherChartSeries(snapshot, datePreset, granularity),
    [snapshot, datePreset, granularity]
  );

  const granularityLabel =
    CHART_GRANULARITY_OPTIONS.find((o) => o.value === granularity)?.label ??
    "Daily";

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Performance</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            Revenue and clicks for the selected date range
          </p>
        </div>
        <div ref={menuRef} className="relative w-fit">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/30 hover:text-foreground"
            aria-expanded={menuOpen}
            aria-haspopup="listbox"
          >
            {granularityLabel}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                menuOpen && "rotate-180"
              )}
            />
          </button>
          {menuOpen ? (
            <ul
              role="listbox"
              className="absolute right-0 z-50 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
            >
              {CHART_GRANULARITY_OPTIONS.map((opt) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={granularity === opt.value}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setGranularity(opt.value);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-50",
                      granularity === opt.value
                        ? "font-medium text-accent"
                        : "text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="flex h-[200px] items-center justify-center text-[13px] text-muted sm:h-[260px]">
          No data in this period yet.
        </p>
      ) : (
        <div className="h-[220px] w-full min-w-0 sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
              barGap={2}
              barCategoryGap="18%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f2"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
                dy={8}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="revenue"
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `€${(v / 1000).toFixed(1)}k` : `€${v}`
                }
              />
              <YAxis
                yAxisId="clicks"
                orientation="right"
                tick={{ fontSize: 11, fill: "#71717a" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<PublisherChartTooltip />}
                cursor={{ fill: "rgba(91, 71, 251, 0.06)" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) =>
                  value === "revenue" ? "Revenue" : "Clicks"
                }
              />
              <Bar
                yAxisId="revenue"
                dataKey="revenue"
                name="revenue"
                fill="#5B47FB"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                yAxisId="clicks"
                dataKey="clicks"
                name="clicks"
                fill="#c4b5fd"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function PublisherChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: PublisherChartPoint }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-[12px] shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-1 text-muted">
        Revenue:{" "}
        <span className="font-medium text-foreground">
          {formatCurrency(row.revenue)}
        </span>
      </p>
      <p className="text-muted">
        Clicks:{" "}
        <span className="font-medium text-foreground">
          {formatNumber(row.clicks)}
        </span>
      </p>
      <p className="text-muted">
        Offers shown:{" "}
        <span className="font-medium text-foreground">
          {formatNumber(row.offersShown)}
        </span>
      </p>
      <p className="text-muted">
        CTR:{" "}
        <span className="font-medium text-foreground">
          {formatPercent(row.ctr)}
        </span>
      </p>
    </div>
  );
}
