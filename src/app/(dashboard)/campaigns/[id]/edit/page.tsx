import { loadCampaignWithMetrics } from "@/lib/api/campaigns-server";
import { CampaignEditorClient } from "@/components/campaigns/campaign-editor-client";
import { notFound } from "next/navigation";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await loadCampaignWithMetrics(id);

  if (!campaign) notFound();

  return <CampaignEditorClient campaign={campaign} />;
}
