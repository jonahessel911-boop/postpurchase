import type { AdvertiserMetricsSnapshot } from "@/lib/metrics-from-snapshot";
import { CampaignsWorkspace } from "@/components/campaigns/campaigns-workspace";

export function CampaignsClient({
  snapshot,
}: {
  snapshot: AdvertiserMetricsSnapshot;
}) {
  return <CampaignsWorkspace snapshot={snapshot} />;
}
