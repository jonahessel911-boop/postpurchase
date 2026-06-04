import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clickId = url.searchParams.get("click_id");
    const value = parseFloat(url.searchParams.get("value") || "0");

    if (!clickId) {
      return new Response(JSON.stringify({ error: "click_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: click, error: clickError } = await supabase
      .from("clicks")
      .select("click_id, campaign_id, campaigns!inner(conversion_goal)")
      .eq("click_id", clickId)
      .single();

    if (clickError || !click) {
      return new Response(JSON.stringify({ error: "Click not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(
        JSON.stringify({
          status: "already_converted",
          click_id: clickId,
          event: conversionGoal,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: insertError } = await supabase.from("conversions").insert({
      click_id: clickId,
      value,
      event: conversionGoal,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({
            status: "already_converted",
            click_id: clickId,
            event: conversionGoal,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to record conversion" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        click_id: clickId,
        event: conversionGoal,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
