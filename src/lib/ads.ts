import type { Ad, AdDraft, AdMetrics, AdWithMetrics, CampaignMetrics } from "./types";

export function newAdId(): string {
  return crypto.randomUUID();
}

export function createEmptyAd(
  index: number,
  options?: { isDraft?: boolean }
): AdDraft {
  const isDraft = options?.isDraft ?? false;
  return {
    id: newAdId(),
    name: `Ad ${index + 1}`,
    active: !isDraft,
    is_draft: isDraft,
    title: "",
    subheadline: "",
    media_url: null,
    media_type: "image",
    cta_text: "Learn more",
  };
}

export function getAdBaseName(ad: AdDraft, ads: AdDraft[]): string {
  const match = ad.name.match(/^(Ad \d+)/i);
  if (match) return match[1];
  const idx = ads.findIndex((a) => a.id === ad.id);
  return `Ad ${idx >= 0 ? idx + 1 : ads.length + 1}`;
}

export function nextVariationName(ads: AdDraft[], sourceAd: AdDraft): string {
  const base = getAdBaseName(sourceAd, ads);
  const prefix = `${base} - VARIATION `;
  const count = ads.filter((a) => a.name.toUpperCase().startsWith(prefix.toUpperCase()))
    .length;
  const letter = String.fromCharCode(65 + count);
  return `${prefix}${letter}`;
}

export function createVariationFromAd(
  source: AdDraft,
  ads: AdDraft[],
  mediaUrl: string,
  mediaType: AdDraft["media_type"]
): AdDraft {
  return {
    id: newAdId(),
    name: nextVariationName(ads, source),
    active: false,
    is_draft: true,
    title: source.title,
    subheadline: source.subheadline,
    cta_text: source.cta_text,
    media_url: mediaUrl,
    media_type: mediaType,
  };
}

export function duplicateAdDraft(ad: AdDraft): AdDraft {
  return {
    ...ad,
    id: newAdId(),
    name: `${ad.name} (copy)`,
  };
}

/** Duplicate an ad within a campaign (variation-style name). */
export function duplicateAdDraftInCampaign(
  source: AdDraft,
  existing: AdDraft[]
): AdDraft {
  return {
    ...source,
    id: newAdId(),
    name: nextVariationName(existing, source),
    active: true,
    is_draft: false,
  };
}

export function activeAdCount(ads: Pick<Ad, "active">[]): number {
  return ads.filter((a) => a.active).length;
}

/** Even split among active ads — 10 active ads → 10% each. */
export function trafficSharePercent(ads: Pick<Ad, "active">[]): number {
  const count = activeAdCount(ads);
  return count > 0 ? 100 / count : 0;
}

/** Pick a random active ad for traffic rotation (used at serve/click time). */
export function pickAdForTraffic<T extends Pick<Ad, "id" | "active">>(
  ads: T[]
): T | null {
  const active = ads.filter((a) => a.active);
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)];
}

export function aggregateAdMetrics(ads: AdWithMetrics[]): CampaignMetrics {
  const spend = ads.reduce((s, a) => s + a.metrics.spend, 0);
  const clicks = ads.reduce((s, a) => s + a.metrics.clicks, 0);
  const conversions = ads.reduce((s, a) => s + a.metrics.conversions, 0);
  const impressions = ads.reduce((s, a) => s + a.metrics.impressions, 0);

  return {
    spend,
    clicks,
    cpc: clicks > 0 ? spend / clicks : 0,
    ctr: impressions > 0 ? clicks / impressions : 0,
    conversions,
    cpa: conversions > 0 ? spend / conversions : 0,
    revenue: 0,
    roas: 0,
  };
}

export function emptyAdMetrics(): AdMetrics {
  return {
    spend: 0,
    clicks: 0,
    cpc: 0,
    ctr: 0,
    conversions: 0,
    cpa: 0,
    impressions: 0,
  };
}

/** Ads visible in campaign / ads tables (excludes drafts). */
export function publishedAds<T extends { is_draft?: boolean }>(ads: T[]): T[] {
  return ads.filter((a) => !(a.is_draft ?? false));
}

export function adToDraft(ad: Ad): AdDraft {
  return {
    id: ad.id,
    name: ad.name,
    active: ad.active,
    is_draft: ad.is_draft ?? false,
    title: ad.title,
    subheadline: ad.subheadline,
    media_url: ad.media_url,
    media_type: ad.media_type,
    cta_text: ad.cta_text,
  };
}
