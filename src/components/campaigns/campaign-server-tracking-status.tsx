import { formatAmsterdamDateTime } from "@/lib/utils";

export function CampaignServerTrackingStatus({
  lastPostbackAt,
  className,
}: {
  lastPostbackAt: string | null | undefined;
  className?: string;
}) {
  if (!lastPostbackAt) {
    return (
      <p className={className ?? "text-[13px] font-medium text-red-600"}>
        No server events received
      </p>
    );
  }

  return (
    <p className={className ?? "text-[13px] font-medium text-emerald-700"}>
      Server side tracking active — last postback{" "}
      {formatAmsterdamDateTime(lastPostbackAt)}
    </p>
  );
}
