import { AdminPublishersClient } from "@/components/admin/admin-publishers-client";
import { loadAdminPublishers } from "@/lib/api/admin-server";

export default async function AdminPublishersPage() {
  const rows = await loadAdminPublishers();
  return <AdminPublishersClient rows={rows} />;
}
