"use client";

import { Card } from "@/components/ui";
import { estimateDailyResults } from "@/lib/estimates";
import type { Vertical } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Info } from "lucide-react";

interface EstimatedResultsProps {
  dailyBudget: number;
  cpc: number;
  vertical: Vertical;
}

function MetricRow({
  label,
  value,
  fill,
}: {
  label: string;
  value: string;
  fill: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-medium">{label}</span>
        <Info className="h-3.5 w-3.5 text-muted" />
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${Math.max(8, fill)}%` }}
        />
      </div>
    </div>
  );
}

export function EstimatedResults({
  dailyBudget,
  cpc,
  vertical,
}: EstimatedResultsProps) {
  const estimate = estimateDailyResults(dailyBudget, cpc, vertical);

  return (
    <Card className="p-5">
      <h3 className="text-[15px] font-semibold">Estimated daily results</h3>
      <p className="mt-1 text-[12px] text-muted">
        Based on {formatCurrency(dailyBudget)}/day at {formatCurrency(cpc)} CPC
      </p>

      {estimate ? (
        <div className="mt-6 space-y-6">
          <MetricRow
            label="Reach"
            value={estimate.reachLabel}
            fill={estimate.reachFill}
          />
          <MetricRow
            label="Clicks"
            value={estimate.clicksLabel}
            fill={estimate.clicksFill}
          />
          <MetricRow
            label="Conversions"
            value={estimate.conversionsLabel}
            fill={estimate.conversionsFill}
          />
        </div>
      ) : (
        <p className="mt-6 text-[13px] text-muted">
          Enter a daily budget and CPC to see estimates.
        </p>
      )}

      <p className="mt-6 text-[11px] leading-relaxed text-muted">
        These are estimated results based on previous ad deliveries, and are in no
        way a guarantee that these ads will perform the same way.
      </p>
    </Card>
  );
}
