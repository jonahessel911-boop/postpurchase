import { NextResponse } from "next/server";
import {
  ClickProcessingError,
  processClickAndGetDestination,
} from "@/lib/api/process-click";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const requestUrl = new URL(request.url);

  try {
    const { destinationUrl } = await processClickAndGetDestination(
      campaignId,
      requestUrl,
      request.headers
    );

    return NextResponse.redirect(destinationUrl, {
      status: 302,
      headers: corsHeaders,
    });
  } catch (err) {
    const message =
      err instanceof ClickProcessingError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Click failed";
    const status = err instanceof ClickProcessingError ? err.status : 500;
    return new NextResponse(message, { status, headers: corsHeaders });
  }
}
