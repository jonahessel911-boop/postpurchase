import { NextResponse } from "next/server";
import { getPublisherAccountId } from "@/lib/api/advertiser-account";
import { loadWidgetOffers } from "@/lib/api/widget-offers";
import { createClient } from "@/lib/supabase/server";
import { hasServiceClient } from "@/lib/supabase/service";
import type { ClickPlacement } from "@/lib/types";
import { normalizePlacement } from "@/lib/click-attribution";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publisherId =
    searchParams.get("publisher_id")?.trim() ||
    searchParams.get("traffic_partner_id")?.trim() ||
    searchParams.get("placement_id")?.trim();

  if (!publisherId) {
    return NextResponse.json(
      { error: "publisher_id (traffic partner id) required" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!hasServiceClient()) {
    return NextResponse.json(
      { error: "Widget API not configured (missing service role key)" },
      { status: 503, headers: corsHeaders }
    );
  }

  const formatParam = searchParams.get("format") ?? searchParams.get("placement");
  const format =
    (formatParam ? normalizePlacement(formatParam) : null) ?? "native";

  try {
    const preview = searchParams.get("preview") === "1";
    let allowPreview = false;
    if (preview) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const owned = await getPublisherAccountId(supabase, user.id);
          allowPreview = owned === publisherId;
        }
      } catch {
        allowPreview = false;
      }
    }

    const payload = await loadWidgetOffers(publisherId, {
      preview: allowPreview,
      format,
      widgetUrl: searchParams.get("widget_url"),
      intentProduct: searchParams.get("intent_product"),
      geoCountry: searchParams.get("geo"),
    });

    if (!payload) {
      return NextResponse.json(
        { error: "Traffic partner not found or inactive" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(payload, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load offers" },
      { status: 500, headers: corsHeaders }
    );
  }
}
