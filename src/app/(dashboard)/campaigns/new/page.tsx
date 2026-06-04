import { CampaignEditorClient } from "@/components/campaigns/campaign-editor-client";
import { createAdPath } from "@/lib/campaign-create-ad";
import { redirect } from "next/navigation";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  const { campaignId } = await searchParams;
  if (campaignId) {
    redirect(createAdPath(campaignId));
  }

  return <CampaignEditorClient isNew />;
}
