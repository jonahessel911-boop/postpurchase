import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureAdvertiserMemberLink } from "@/lib/api/advertiser-account";

/** Ensures a row exists in public.advertisers for the current auth user. */
export async function ensureAdvertiserProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<void> {
  const { error: rpcError } = await supabase.rpc("ensure_advertiser_profile");
  if (!rpcError) {
    await ensureAdvertiserMemberLink(supabase, userId, userId, "owner");
    return;
  }

  const { data: existing } = await supabase
    .from("advertisers")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing?.id) {
    await ensureAdvertiserMemberLink(
      supabase,
      userId,
      existing.id as string,
      "owner"
    );
    return;
  }

  const { error: insertError } = await supabase.from("advertisers").insert({
    id: userId,
    email: email.trim() || "",
    company_name: email.split("@")[1] || "Advertiser",
    wallet_balance: 0,
  });

  if (!insertError) {
    await ensureAdvertiserMemberLink(supabase, userId, userId, "owner");
    return;
  }

  if (
    typeof window !== "undefined" &&
    insertError.message.includes("row-level security")
  ) {
    const res = await fetch("/api/advertiser/ensure", { method: "POST" });
    if (res.ok) return;
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? insertError.message
    );
  }

  throw new Error(insertError.message);
}
