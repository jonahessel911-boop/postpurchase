"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { DateRangePreset } from "@/lib/date-range";
import {
  buildChartSeries,
  CHART_GRANULARITY_OPTIONS,
  defaultGranularityForPreset,
  type ChartGranularity,
} from "@/lib/chart-series";

interface SpendChartProps {
  /** Advertiser dashboard: raw events + date filter. */
  clicks?: { cost: number; created_at: string }[];
  conversions?: { value: number; created_at: string }[];
  datePreset?: DateRangePreset;
  /** Admin / legacy: pre-aggregated daily points. */
  data?: { label: string; spend: number }[];
}

export function SpendChart({
  clicks = [],
  conversions = [],
  datePreset = "30d",
  data: staticData,
}: SpendChartProps) {
  const useStatic = staticData != null && staticData.length > 0;

  const [granularity, setGranularity] = useState<ChartGranularity>(() =>
    defaultGranularityForPreset(datePreset)
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!useStatic) setGranularity(defaultGranularityForPreset(datePreset));
  }, [datePreset, useStatic]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const chartData = useMemo(() => {
    if (useStatic) return staticData;
    return buildChartSeries(clicks, conversions, datePreset, granularity);
  }, [
    useStatic,
    staticData,
    clicks,
    conversions,
    datePreset,
    granularity,
  ]);

  const granularityLabel =
    CHART_GRANULARITY_OPTIONS.find((o) => o.value === granularity)?.label ??
    "Daily";

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold">Spend</h2>
        {!useStatic ? (
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
        ) : null}
      </div>
      <div className="h-[200px] w-full min-w-0 sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5B47FB" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#5B47FB" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tick={{ fontSize: 11, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${v}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
              formatter={(value: number) => [formatCurrency(value), "Spend"]}
            />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#5B47FB"
              strokeWidth={2}
              fill="url(#spendGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
