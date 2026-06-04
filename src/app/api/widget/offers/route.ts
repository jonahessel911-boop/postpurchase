import { NextResponse } from "next/server";
import { getPublisherPlacement } from "@/lib/api/publisher-placements";
import { loadWidgetOffers } from "@/lib/api/widget-offers";
import { createClient } from "@/lib/supabase/server";
import { hasServiceClient } from "@/lib/supabase/service";

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
  const placementId = searchParams.get("placement_id")?.trim();

  if (!placementId) {
    return NextResponse.json(
      { error: "placement_id required" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!hasServiceClient()) {
    return NextResponse.json(
      { error: "Widget API not configured (missing service role key)" },
      { status: 503, headers: corsHeaders }
    );
  }

  try {
    const preview = searchParams.get("preview") === "1";
    let allowPreview = false;
    if (preview) {
      try {
        const supabase = await createClient();
        const owned = await getPublisherPlacement(supabase, placementId);
        allowPreview = !!owned;
      } catch {
        allowPreview = false;
      }
    }

    const payload = await loadWidgetOffers(placementId, {
      preview: allowPreview,
    });
    if (!payload) {
      return NextResponse.json(
        { error: "Placement not found or inactive" },
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
