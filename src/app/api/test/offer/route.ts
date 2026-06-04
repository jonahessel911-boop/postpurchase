import { NextResponse } from "next/server";
import { loadRandomTestOffer } from "@/lib/api/test-offer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;

  const offer = await loadRandomTestOffer(campaignId);

  if (!offer) {
    return NextResponse.json(
      {
        error:
          "No active campaign with ads found. Approve a campaign, turn it on, and add an active ad.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ offer });
}
