import { AdminShell } from "@/components/admin/admin-shell";
import { loadAdminPlatformTotals } from "@/lib/api/admin-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const platformTotals = await loadAdminPlatformTotals();

  return <AdminShell platformTotals={platformTotals}>{children}</AdminShell>;
}
