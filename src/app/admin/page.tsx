import { AdminOverviewClient } from "@/components/admin/admin-overview-client";
import { loadAdminOverviewData } from "@/lib/api/admin-server";

export default async function AdminPage() {
  const data = await loadAdminOverviewData();
  return <AdminOverviewClient data={data} />;
}
