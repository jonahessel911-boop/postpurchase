"use client";

import { useState } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";
import { estimateDailyResults } from "@/lib/estimates";
import { verticalLabel } from "@/lib/campaign-types";
import type { Vertical } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function WizardEstimatesPanel({
  dailyBudget,
  cpc,
  vertical,
  collapsible,
  className,
}: {
  dailyBudget: number;
  cpc: number;
  vertical: Vertical;
  collapsible?: boolean;
  className?: string;
}) {
  const estimates = estimateDailyResults(dailyBudget, cpc, vertical);
  const [open, setOpen] = useState(false);

  const body = (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        <EstimateRow label="Est. clicks" value={estimates?.clicksLabel ?? "—"} />
        <EstimateRow
          label="Est. conversions"
          value={estimates?.conversionsLabel ?? "—"}
          highlight
        />
        <EstimateRow label="Est. reach" value={estimates?.reachLabel ?? "—"} />
      </div>
      {estimates ? (
        <p className="flex items-start gap-2 rounded-lg bg-zinc-50 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-600">
          <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
          Based on {formatCurrency(dailyBudget)}/day at {formatCurrency(cpc)} in{" "}
          {verticalLabel(vertical).toLowerCase()}.
        </p>
      ) : (
        <p className="text-[12px] text-zinc-400">
          Set budget and CPC to see estimates.
        </p>
      )}
    </div>
  );

  if (collapsible) {
    return (
      <div className={cn("border-b border-zinc-100 bg-white lg:hidden", className)}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-[13px] font-medium text-zinc-900">
            Estimated results
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-zinc-400 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
        {open ? <div className="px-4 pb-4">{body}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        Estimated results
      </p>
      <div className="mt-3">{body}</div>
    </div>
  );
}

function EstimateRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-zinc-50/80 px-3 py-2">
      <span className="text-[12px] text-zinc-500">{label}</span>
      <span
        className={cn(
          "text-[13px] font-semibold tabular-nums",
          highlight ? "text-zinc-900" : "text-zinc-700"
        )}
      >
        {value}
      </span>
    </div>
  );
}
