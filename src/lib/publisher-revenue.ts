/** Share of advertiser CPC paid out to the traffic partner. */
export const PUBLISHER_REVENUE_SHARE = 0.7;

export function publisherEarningsFromClickCost(totalCpc: number): number {
  return totalCpc * PUBLISHER_REVENUE_SHARE;
}

export function publisherCtr(clicks: number, offersShown: number): number {
  if (offersShown <= 0) return 0;
  return clicks / offersShown;
}
