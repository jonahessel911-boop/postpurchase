import { AdminCampaignsClient } from "@/components/admin/admin-campaigns-client";
import {
  loadAdminCampaigns,
  loadAdminPlatformTotals,
} from "@/lib/api/admin-server";

export default async function AdminCampaignsPage() {
  const [campaigns, totals] = await Promise.all([
    loadAdminCampaigns(),
    loadAdminPlatformTotals(),
  ]);

  return <AdminCampaignsClient campaigns={campaigns} totals={totals} />;
}
