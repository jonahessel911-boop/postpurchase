import { getServiceClient, hasServiceClient } from "@/lib/supabase/service";

export interface PostbackResult {
  status: "ok" | "already_converted";
  clickId: string;
  event: string;
  value: number;
}

export async function recordPostback(
  clickId: string,
  value = 0
): Promise<PostbackResult> {
  if (!hasServiceClient()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing — add it to .env.local and restart."
    );
  }

  if (!clickId) throw new Error("click_id required");

  const supabase = getServiceClient();

  const { data: click, error: clickError } = await supabase
    .from("clicks")
    .select("click_id, campaign_id, campaigns!inner(conversion_goal)")
    .eq("click_id", clickId)
    .single();

  if (clickError || !click) {
    throw new Error("Click not found — register a click first");
  }

  const campaigns = click.campaigns as
    | { conversion_goal: string }
    | { conversion_goal: string }[];
  const conversionGoal = Array.isArray(campaigns)
    ? campaigns[0]?.conversion_goal ?? "lead"
    : campaigns.conversion_goal ?? "lead";

  const { data: existing } = await supabase
    .from("conversions")
    .select("id")
    .eq("click_id", clickId)
    .maybeSingle();

  if (existing) {
    return {
      status: "already_converted",
      clickId,
      event: conversionGoal,
      value,
    };
  }

  const { error: insertError } = await supabase.from("conversions").insert({
    click_id: clickId,
    value,
    event: conversionGoal,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        status: "already_converted",
        clickId,
        event: conversionGoal,
        value,
      };
    }
    throw new Error("Failed to record conversion");
  }

  return { status: "ok", clickId, event: conversionGoal, value };
}
