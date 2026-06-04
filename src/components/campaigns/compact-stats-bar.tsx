import { cn } from "@/lib/utils";

export interface KpiStripItem {
  label: string;
  value: string;
  highlight?: boolean;
}

/** Inline stats — use CampaignKpiStrip for the campaigns page. */
export function CompactStatsBar({ items }: { items: KpiStripItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px] tabular-nums text-zinc-500">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-baseline gap-1.5">
          <span>{item.label}</span>
          <span className="font-medium text-zinc-900">{item.value}</span>
        </span>
      ))}
    </div>
  );
}

export function CampaignKpiStrip({
  items,
  className,
}: {
  items: KpiStripItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-md border border-zinc-200 bg-zinc-200 sm:grid-cols-3 xl:grid-cols-6",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white px-3 py-2 sm:px-3.5"
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-0.5 font-mono text-[15px] font-semibold leading-none tabular-nums tracking-tight text-zinc-950",
              item.highlight && "text-[#5B47FB]"
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
