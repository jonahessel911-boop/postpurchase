import { NextResponse } from "next/server";
import { getClickAttributionByClickId } from "@/lib/api/click-attribution";
import { hasServiceClient } from "@/lib/supabase/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clickId: string }> }
) {
  const { clickId } = await params;

  if (!clickId?.trim()) {
    return NextResponse.json({ error: "click_id required" }, { status: 400 });
  }

  if (!hasServiceClient()) {
    return NextResponse.json(
      { error: "Server not configured for click lookup" },
      { status: 503 }
    );
  }

  const record = await getClickAttributionByClickId(clickId.trim());
  if (!record) {
    return NextResponse.json({ error: "Click not found" }, { status: 404 });
  }

  return NextResponse.json({ click: record });
}
