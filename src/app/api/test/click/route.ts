import { NextResponse } from "next/server";
import { recordTestClick } from "@/lib/api/test-tracking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const campaignId = body.campaignId as string;

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    }

    const result = await recordTestClick(campaignId, {
      trackingUrl: body.trackingUrl as string | undefined,
      attribution: body.attribution,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Click failed" },
      { status: 400 }
    );
  }
}

/** Legacy GET redirect — kept for backwards compatibility */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId");

  if (!campaignId) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }

  try {
    const result = await recordTestClick(campaignId);
    const postbackPage = new URL("/test", request.url);
    postbackPage.searchParams.set("click_id", result.clickId);
    postbackPage.searchParams.set("destination", result.destinationUrl);
    return NextResponse.redirect(postbackPage);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Click failed" },
      { status: 400 }
    );
  }
}
