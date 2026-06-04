import { PublisherResourcesClient } from "@/components/publisher/publisher-resources-client";
import { loadPublisherDashboardContext } from "@/lib/api/publisher-metrics-server";
import { redirect } from "next/navigation";

export default async function PublisherResourcesPage() {
  const ctx = await loadPublisherDashboardContext();
  if (!ctx?.publisherId) redirect("/login/publisher");

  return <PublisherResourcesClient partnerId={ctx.publisherId} />;
}
