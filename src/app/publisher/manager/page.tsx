import { ManagerWorkspace } from "@/components/publisher/manager-workspace";
import { loadPublisherDashboardContext } from "@/lib/api/publisher-metrics-server";
import { redirect } from "next/navigation";

export default async function PublisherManagerPage() {
  const ctx = await loadPublisherDashboardContext();
  if (!ctx?.publisherId) redirect("/login/publisher");

  return <ManagerWorkspace snapshot={ctx.snapshot} />;
}
