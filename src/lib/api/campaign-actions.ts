import { createClient } from "@/lib/supabase/client";
import { getAdvertiserAccountId } from "@/lib/api/advertiser-account";
import { ensureAdvertiserProfile } from "@/lib/api/ensure-advertiser";
import { persistAdMediaUrl } from "@/lib/api/ad-media";
import {
  adToDraft,
  createEmptyAd,
  duplicateAdDraftInCampaign,
} from "@/lib/ads";
import type {
  Ad,
  AdDraft,
  ConversionGoal,
  EndDateMode,
  Vertical,
} from "@/lib/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

function isExistingAd(id: string, existingIds: Set<string>): boolean {
  return isUuid(id) && existingIds.has(id);
}

export interface SaveCampaignInput {
  name: string;
  vertical: Vertical;
  cpc_bid: number;
  daily_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  end_date_mode: EndDateMode;
  destination_url: string;
  conversion_goal: ConversionGoal;
  ads: AdDraft[];
}

/** Turn campaign on after publish / launch (no review step). */
export async function launchCampaign(campaignId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ status: "approved", on_off: true })
    .eq("id", campaignId);

  if (error) throw new Error(error.message);
}

export async function updateCampaignOnOff(
  campaignId: string,
  onOff: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ on_off: onOff })
    .eq("id", campaignId);

  if (error) throw new Error(error.message);
}

export async function bulkUpdateCampaignsOnOff(
  campaignIds: string[],
  onOff: boolean
): Promise<void> {
  if (!campaignIds.length) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ on_off: onOff })
    .in("id", campaignIds);

  if (error) throw new Error(error.message);
}

export async function updateAdActive(
  adId: string,
  active: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ads")
    .update({ active })
    .eq("id", adId);

  if (error) throw new Error(error.message);
}

export interface SaveCampaignResult {
  campaignId: string;
  /** Maps client-side ad id → persisted ad id (new inserts get a new uuid). */
  adIds: Record<string, string>;
}

export async function saveCampaign(
  input: SaveCampaignInput,
  campaignId?: string
): Promise<SaveCampaignResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await ensureAdvertiserProfile(
    supabase,
    user.id,
    user.email ?? ""
  );

  let advertiserId = await getAdvertiserAccountId(supabase, user.id, {
    campaignId,
  });
  if (!advertiserId) {
    throw new Error(
      "No advertiser account linked to this user. Sign out and sign in again, or contact support."
    );
  }

  const adsToSave =
    input.ads.length > 0 ? input.ads : [createEmptyAd(0)];

  const campaignPayload = {
    name: input.name,
    vertical: input.vertical,
    cpc_bid: input.cpc_bid,
    daily_budget: input.daily_budget,
    start_date: input.start_date,
    end_date: input.end_date,
    destination_url: input.destination_url,
    conversion_goal: input.conversion_goal,
  };

  let id = campaignId;

  if (!id) {
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        ...campaignPayload,
        advertiser_id: advertiserId,
        status: "approved",
        on_off: false,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create campaign");
    }
    id = data.id;
  } else {
    const { error } = await supabase
      .from("campaigns")
      .update(campaignPayload)
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  if (!id) throw new Error("Campaign ID missing");

  const { data: existingAds, error: existingError } = await supabase
    .from("ads")
    .select("id")
    .eq("campaign_id", id);

  if (existingError) throw new Error(existingError.message);

  const existingIds = new Set((existingAds ?? []).map((a) => a.id));
  const keptIds = new Set<string>();
  const adIds: Record<string, string> = {};

  for (const ad of adsToSave) {
    const existing = isExistingAd(ad.id, existingIds);
    const storageKey = existing ? ad.id : crypto.randomUUID();

    const media_url = await persistAdMediaUrl(
      supabase,
      user.id,
      id,
      storageKey,
      ad.media_url,
      ad.media_type
    );

    const adPayload = {
      campaign_id: id,
      name: ad.name,
      active: ad.active,
      title: ad.title,
      subheadline: ad.subheadline,
      media_url,
      media_type: ad.media_type,
      cta_text: ad.cta_text,
    };

    if (existing) {
      keptIds.add(ad.id);
      adIds[ad.id] = ad.id;
      const { error } = await supabase
        .from("ads")
        .update(adPayload)
        .eq("id", ad.id);
      if (error) throw new Error(`Failed to update ad: ${error.message}`);
    } else {
      const { data, error } = await supabase
        .from("ads")
        .insert(adPayload)
        .select("id")
        .single();
      if (error || !data) {
        throw new Error(`Failed to save ads: ${error?.message ?? "Unknown error"}`);
      }
      const persistedId = data.id as string;
      keptIds.add(persistedId);
      adIds[ad.id] = persistedId;
    }
  }

  const toDelete = [...existingIds].filter((adId) => !keptIds.has(adId));
  if (toDelete.length) {
    const { error } = await supabase.from("ads").delete().in("id", toDelete);
    if (error) throw new Error(`Failed to remove ads: ${error.message}`);
  }

  return { campaignId: id, adIds };
}

async function insertCampaignAd(
  campaignId: string,
  draft: AdDraft
): Promise<Ad> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const storageKey = crypto.randomUUID();
  const media_url = await persistAdMediaUrl(
    supabase,
    user.id,
    campaignId,
    storageKey,
    draft.media_url,
    draft.media_type
  );

  const { data, error } = await supabase
    .from("ads")
    .insert({
      campaign_id: campaignId,
      name: draft.name,
      active: draft.active,
      is_draft: draft.is_draft ?? false,
      title: draft.title,
      subheadline: draft.subheadline,
      media_url,
      media_type: draft.media_type,
      cta_text: draft.cta_text,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create ad");
  }

  return data as Ad;
}

export async function createCampaignAd(
  campaignId: string,
  adCount: number
): Promise<Ad> {
  return insertCampaignAd(campaignId, createEmptyAd(adCount));
}

export async function duplicateCampaignAd(
  campaignId: string,
  sourceAdId: string
): Promise<Ad> {
  const supabase = createClient();
  const { data: ads, error } = await supabase
    .from("ads")
    .select("*")
    .eq("campaign_id", campaignId);

  if (error) throw new Error(error.message);

  const source = (ads ?? []).find((a) => a.id === sourceAdId);
  if (!source) throw new Error("Ad not found");

  const draft = duplicateAdDraftInCampaign(
    adToDraft(source as Ad),
    (ads ?? []).map((a) => adToDraft(a as Ad))
  );

  return insertCampaignAd(campaignId, draft);
}

export async function fetchAdvertiserProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const accountId = await getAdvertiserAccountId(supabase, user.id);
  if (!accountId) return null;

  const { data, error } = await supabase
    .from("advertisers")
    .select("*")
    .eq("id", accountId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...data,
    wallet_balance: Number(data.wallet_balance),
    email: data.email ?? user.email ?? "",
  };
}

export async function topUpWallet(amount: number): Promise<number> {
  const supabase = createClient();
  const profile = await fetchAdvertiserProfile();
  if (!profile) throw new Error("Advertiser not found");

  const next = profile.wallet_balance + amount;
  const { error } = await supabase
    .from("advertisers")
    .update({ wallet_balance: next })
    .eq("id", profile.id);

  if (error) throw new Error(error.message);
  return next;
}
