import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createPublisherPlacement,
  listPublisherPlacements,
} from "@/lib/api/publisher-placements";
import type { PublisherPlacementInput } from "@/lib/publisher-types";
import type { ClickPlacement } from "@/lib/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const placements = await listPublisherPlacements(supabase);
    return NextResponse.json({ placements });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load";
    const status = message.includes("authenticated") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PublisherPlacementInput;
    const supabase = await createClient();
    const placement = await createPublisherPlacement(supabase, {
      name: body.name,
      site_url: body.site_url ?? "",
      page_path: body.page_path ?? "/confirmation",
      intent_product: body.intent_product ?? "",
      placement: (body.placement ?? "native") as ClickPlacement,
      geo_country: body.geo_country,
      max_offers: body.max_offers,
      active: body.active ?? true,
    });
    return NextResponse.json({ placement });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create";
    const status = message.includes("authenticated") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
