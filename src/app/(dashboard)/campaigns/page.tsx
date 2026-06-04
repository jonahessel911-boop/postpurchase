import { loadAdvertiserMetricsSnapshot } from "@/lib/api/campaigns-server";
import { CampaignsClient } from "@/components/campaigns/campaigns-client";

export default async function CampaignsPage() {
  const snapshot = await loadAdvertiserMetricsSnapshot(null);
  return <CampaignsClient snapshot={snapshot} />;
}
