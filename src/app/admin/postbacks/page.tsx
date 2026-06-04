import { AdminPostbacksClient } from "@/components/admin/admin-postbacks-client";
import { loadAdminPostbackLogs } from "@/lib/api/admin-server";

export default async function AdminPostbacksPage() {
  const logs = await loadAdminPostbackLogs();
  return <AdminPostbacksClient logs={logs} />;
}
