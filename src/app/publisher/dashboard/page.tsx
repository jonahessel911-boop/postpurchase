import { PublisherDashboardClient } from "@/components/publisher/publisher-dashboard-client";
import { loadPublisherDashboardContext } from "@/lib/api/publisher-metrics-server";
import { redirect } from "next/navigation";

export default async function PublisherDashboardPage() {
  const ctx = await loadPublisherDashboardContext();
  if (!ctx?.publisherId) redirect("/login/publisher");

  return <PublisherDashboardClient snapshot={ctx.snapshot} />;
}
