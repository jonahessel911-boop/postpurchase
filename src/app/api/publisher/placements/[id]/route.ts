import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deletePublisherPlacement,
  getPublisherPlacement,
  updatePublisherPlacement,
} from "@/lib/api/publisher-placements";
import type { PublisherPlacementInput } from "@/lib/publisher-types";
import type { ClickPlacement } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const placement = await getPublisherPlacement(supabase, id);
    if (!placement) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ placement });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load";
    const status = message.includes("authenticated") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<PublisherPlacementInput>;
    const supabase = await createClient();
    const placement = await updatePublisherPlacement(supabase, id, {
      ...body,
      placement: body.placement as ClickPlacement | undefined,
    });
    return NextResponse.json({ placement });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update";
    const status = message.includes("authenticated") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    await deletePublisherPlacement(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete";
    const status = message.includes("authenticated") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
