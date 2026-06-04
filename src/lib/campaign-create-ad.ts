/** Which campaign to add an ad to (single-campaign context only). */
export function resolveCreateAdCampaignId(
  selectedAdIds: Set<string>,
  adRows: { id: string; campaign: { id: string } }[]
): string | null {
  const fromSelection =
    selectedAdIds.size > 0
      ? adRows.filter((r) => selectedAdIds.has(r.id))
      : adRows;

  if (!fromSelection.length) return null;

  const campaignIds = new Set(fromSelection.map((r) => r.campaign.id));
  if (campaignIds.size !== 1) return null;
  return [...campaignIds][0];
}

export function createAdPath(campaignId: string): string {
  return `/campaigns/${campaignId}/edit?newAd=1`;
}
