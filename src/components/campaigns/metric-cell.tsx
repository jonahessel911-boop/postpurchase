import { cn } from "@/lib/utils";

export function MetricCell({
  value,
  change,
  benchmark,
  emphasize,
  muted,
}: {
  value: string;
  change?: number;
  benchmark?: number;
  emphasize?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="text-right">
      <div
        className={cn(
          "font-mono text-[14px] tabular-nums",
          emphasize ? "font-semibold text-zinc-900" : "font-medium",
          muted ? "text-zinc-500" : "text-zinc-800"
        )}
      >
        {value}
      </div>
      {change !== undefined && (
        <div
          className={cn(
            "mt-0.5 text-[11px] tabular-nums",
            change >= 0 ? "text-emerald-600" : "text-red-500"
          )}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(1)}%
        </div>
      )}
      {benchmark !== undefined && (
        <div className="mt-0.5 text-[11px] tabular-nums text-zinc-400">
          {benchmark >= 0 ? "+" : ""}
          {benchmark.toFixed(1)}% bench
        </div>
      )}
    </div>
  );
}
