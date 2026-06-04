import type { SupabaseClient } from "@supabase/supabase-js";

/** Link user to advertiser account when table exists (no-op on duplicate / missing table). */
export async function ensureAdvertiserMemberLink(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
  role: "owner" | "member" = "owner"
): Promise<void> {
  const { error } = await supabase.from("account_members").insert({
    user_id: userId,
    account_id: accountId,
    account_type: "advertiser",
    role,
  });

  if (!error) return;
  if (
    error.code === "23505" ||
    error.message.includes("duplicate") ||
    error.code === "42P01"
  ) {
    return;
  }
}

async function fromAccountMembers(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: members, error } = await supabase
    .from("account_members")
    .select("account_id, role")
    .eq("user_id", userId)
    .eq("account_type", "advertiser");

  if (error) {
    if (error.code !== "42P01") {
      console.warn("account_members lookup:", error.message);
    }
    return null;
  }
  if (!members?.length) return null;

  const owner = members.find((m) => m.role === "owner");
  return (owner ?? members[0]).account_id as string;
}

async function fromLegacyAdvertiserRow(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("advertisers")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.id) return null;

  await ensureAdvertiserMemberLink(supabase, userId, data.id as string, "owner");
  return data.id as string;
}

async function fromAccessibleCampaign(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string
): Promise<string | null> {
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("advertiser_id")
    .eq("id", campaignId)
    .maybeSingle();

  if (error || !campaign?.advertiser_id) return null;

  const accountId = campaign.advertiser_id as string;
  await ensureAdvertiserMemberLink(supabase, userId, accountId, "owner");
  return accountId;
}

/**
 * Resolves the advertiser account id for the logged-in user.
 * Supports account_members, legacy 1:1 rows, and auto-repair of missing links.
 */
export async function getAdvertiserAccountId(
  supabase: SupabaseClient,
  userId: string,
  options?: { campaignId?: string }
): Promise<string | null> {
  const fromMembers = await fromAccountMembers(supabase, userId);
  if (fromMembers) return fromMembers;

  const legacy = await fromLegacyAdvertiserRow(supabase, userId);
  if (legacy) return legacy;

  if (options?.campaignId) {
    return fromAccessibleCampaign(supabase, userId, options.campaignId);
  }

  return null;
}

export async function getPublisherAccountId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: members, error } = await supabase
    .from("account_members")
    .select("account_id, role")
    .eq("user_id", userId)
    .eq("account_type", "publisher");

  if (error) return null;
  if (!members?.length) return null;

  const owner = members.find((m) => m.role === "owner");
  return (owner ?? members[0]).account_id as string;
}
