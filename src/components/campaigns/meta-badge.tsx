import type { CampaignStatus } from "@/lib/types";
import { isCampaignRejected } from "@/lib/campaign-status";
import { cn } from "@/lib/utils";

function statusConfig(status: CampaignStatus, onOff: boolean) {
  if (isCampaignRejected(status)) {
    return {
      label: "Rejected",
      className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15",
      dot: "bg-red-500",
    };
  }
  if (onOff) {
    return {
      label: "Active",
      className:
        "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
      dot: "bg-emerald-500",
    };
  }
  return {
    label: "Paused",
    className: "bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-300/80",
    dot: "bg-zinc-400",
  };
}

export function MetaStatusBadge({
  status,
  onOff,
  compact = false,
  anchor = false,
}: {
  status: CampaignStatus;
  onOff: boolean;
  compact?: boolean;
  /** Colored pill — primary visual anchor on dense tables */
  anchor?: boolean;
}) {
  const config = statusConfig(status, onOff);

  if (anchor) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold leading-none",
          config.className
        )}
      >
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dot)}
        />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        compact ? "text-[11px] text-zinc-600" : "text-[12px] font-medium text-zinc-700"
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export function CompactBadge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "green" | "purple";
}) {
  const styles = {
    neutral: "bg-zinc-100 text-zinc-600",
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-violet-50 text-violet-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
        styles[variant]
      )}
    >
      {children}
    </span>
  );
}

export function VerticalTag({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
      {label}
    </span>
  );
}
