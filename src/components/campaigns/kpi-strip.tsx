import { cn } from "@/lib/utils";

export interface KpiItem {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

export function KpiStrip({ items }: { items: KpiItem[] }) {
  const colClass =
    items.length <= 2
      ? "grid-cols-2"
      : items.length === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        colClass
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white px-4 py-3 first:rounded-tl-xl last:rounded-br-xl sm:first:rounded-bl-xl lg:last:rounded-tr-xl"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-1 font-mono text-base font-semibold tabular-nums tracking-tight text-zinc-900 sm:text-[18px]",
              item.highlight && "text-accent"
            )}
          >
            {item.value}
          </p>
          {item.sub && (
            <p className="mt-0.5 text-[11px] text-zinc-400">{item.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
