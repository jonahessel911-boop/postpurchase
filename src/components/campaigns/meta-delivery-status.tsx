import type { AdRow } from "@/lib/campaign-table-utils";
import {
  isAdDelivering,
  isCampaignOn,
  isCampaignRejected,
} from "@/lib/campaign-status";
import { cn } from "@/lib/utils";

export type DeliveryState = "active" | "paused" | "rejected";

export function getAdDeliveryState(row: AdRow): DeliveryState {
  if (isCampaignRejected(row.campaign.status)) return "rejected";
  if (isAdDelivering(row.campaign, row.ad.active)) return "active";
  return "paused";
}

const CONFIG: Record<
  DeliveryState,
  { label: string; dot: "hollow" | "solid" | "gray" }
> = {
  active: { label: "Active", dot: "solid" },
  paused: { label: "Paused", dot: "gray" },
  rejected: { label: "Not delivering", dot: "gray" },
};

export function MetaDeliveryStatus({ row }: { row: AdRow }) {
  const state = getAdDeliveryState(row);
  const { label, dot } = CONFIG[state];

  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-zinc-800">
      <DeliveryDot variant={dot} />
      {label}
    </span>
  );
}

function DeliveryDot({
  variant,
}: {
  variant: "hollow" | "solid" | "gray";
}) {
  if (variant === "solid") {
    return (
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
    );
  }
  if (variant === "hollow") {
    return (
      <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-accent bg-transparent" />
    );
  }
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-300" />;
}
