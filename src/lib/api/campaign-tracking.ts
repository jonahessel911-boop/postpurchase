import type { SupabaseClient } from "@supabase/supabase-js";

/** Latest postback timestamp for a campaign (max conversions.created_at). */
export async function loadLastPostbackAt(
  supabase: SupabaseClient,
  clickIds: string[]
): Promise<string | null> {
  if (!clickIds.length) return null;

  const { data, error } = await supabase
    .from("conversions")
    .select("created_at")
    .in("click_id", clickIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("loadLastPostbackAt:", error.message);
    return null;
  }

  return (data?.created_at as string) ?? null;
}
