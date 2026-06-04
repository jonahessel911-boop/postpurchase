import { loadAdvertiserMetricsSnapshot } from "@/lib/api/campaigns-server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const snapshot = await loadAdvertiserMetricsSnapshot(null);
  return <DashboardClient snapshot={snapshot} />;
}
