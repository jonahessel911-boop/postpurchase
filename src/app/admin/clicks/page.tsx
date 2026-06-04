import { AdminClicksClient } from "@/components/admin/admin-clicks-client";
import { loadAdminClickLogs } from "@/lib/api/admin-server";

export default async function AdminClicksPage() {
  const logs = await loadAdminClickLogs();
  return <AdminClicksClient logs={logs} />;
}
