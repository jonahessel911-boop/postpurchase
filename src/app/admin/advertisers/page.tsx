import { AdminAdvertisersClient } from "@/components/admin/admin-advertisers-client";
import { loadAdminAdvertiserRows } from "@/lib/api/admin-server";

export default async function AdminAdvertisersPage() {
  const rows = await loadAdminAdvertiserRows();
  return <AdminAdvertisersClient rows={rows} />;
}
