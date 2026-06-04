import { loadCampaignWithMetrics } from "@/lib/api/campaigns-server";
import { CampaignDetailPage } from "@/components/campaigns/campaign-detail-page";
import { notFound } from "next/navigation";

export default async function CampaignDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await loadCampaignWithMetrics(id);

  if (!campaign) notFound();

  return <CampaignDetailPage campaign={campaign} />;
}
